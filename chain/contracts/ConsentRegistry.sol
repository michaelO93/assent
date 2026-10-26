// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

/// @title Assent ConsentRegistry
/// @notice Tamper-evident record of verifiable parental consent for children's data processing.
/// No personal data is stored: a child appears only as a per-app pseudonym, and the consent
/// receipt (what was agreed to) appears only as a hash plus the scope list the parent approved.
/// Grants and revocations must be signed by the guardian, so the operator relaying transactions
/// can neither fabricate nor backdate consent on a parent's behalf.
contract ConsentRegistry is EIP712 {
    enum AgeBand {
        Under13,
        Age13To15,
        Age16To17
    }

    struct Consent {
        address guardian;
        bytes32 appId;
        bytes32 subject; // keccak256(childSecret, appId): unlinkable across apps
        bytes32 receiptHash; // keccak256 of the canonical consent receipt JSON
        AgeBand ageBand;
        uint64 grantedAt;
        uint64 expiresAt;
        uint64 revokedAt;
        string scopes; // comma-separated scope ids the guardian approved
    }

    /// @notice A grant as submitted by the relayer. `requestId` links it to the device that asked
    /// (the QR code on a child's screen); zero when the request and approval share a device.
    struct GrantInput {
        address guardian;
        bytes32 appId;
        bytes32 subject;
        bytes32 receiptHash;
        AgeBand ageBand;
        uint64 expiresAt;
        bytes32 requestId;
        string scopes;
    }

    bytes32 private constant GRANT_TYPEHASH = keccak256(
        "Grant(bytes32 appId,bytes32 subject,bytes32 receiptHash,uint8 ageBand,uint64 expiresAt,bytes32 requestId,uint256 nonce)"
    );
    bytes32 private constant REVOKE_TYPEHASH = keccak256("Revoke(bytes32 consentId,uint256 nonce)");

    address public attestor;
    mapping(address => uint64) public guardianVerifiedAt;
    mapping(address => uint256) public nonces;
    mapping(bytes32 => Consent) private _consents;
    mapping(address => bytes32[]) private _guardianConsents;
    /// @notice Lets the requesting device find the consent its QR code led to.
    mapping(bytes32 => bytes32) public consentByRequest;

    event AttestorChanged(address indexed attestor);
    event GuardianVerified(address indexed guardian, bytes32 evidenceHash);
    event GuardianUnverified(address indexed guardian);
    event ConsentGranted(
        bytes32 indexed consentId,
        address indexed guardian,
        bytes32 indexed appId,
        bytes32 subject,
        bytes32 receiptHash,
        AgeBand ageBand,
        uint64 expiresAt,
        string scopes
    );
    event ConsentRevoked(bytes32 indexed consentId, address indexed guardian, bytes32 indexed appId);

    error NotAttestor();
    error GuardianNotVerified();
    error BadSignature();
    error AlreadyExpired();
    error UnknownConsent();
    error AlreadyRevoked();
    error RequestAlreadyUsed();

    constructor(address attestor_) EIP712("Assent", "1") {
        attestor = attestor_;
        emit AttestorChanged(attestor_);
    }

    modifier onlyAttestor() {
        if (msg.sender != attestor) revert NotAttestor();
        _;
    }

    function setAttestor(address attestor_) external onlyAttestor {
        attestor = attestor_;
        emit AttestorChanged(attestor_);
    }

    /// @notice Record that an identity provider confirmed `guardian` is an adult.
    /// @param evidenceHash hash of the provider's verification reference (never the ID itself)
    function verifyGuardian(address guardian, bytes32 evidenceHash) external onlyAttestor {
        guardianVerifiedAt[guardian] = uint64(block.timestamp);
        emit GuardianVerified(guardian, evidenceHash);
    }

    function unverifyGuardian(address guardian) external onlyAttestor {
        delete guardianVerifiedAt[guardian];
        emit GuardianUnverified(guardian);
    }

    function grant(GrantInput calldata g, bytes calldata signature) external returns (bytes32 consentId) {
        if (guardianVerifiedAt[g.guardian] == 0) revert GuardianNotVerified();
        if (g.expiresAt <= block.timestamp) revert AlreadyExpired();
        if (g.requestId != bytes32(0) && consentByRequest[g.requestId] != bytes32(0)) revert RequestAlreadyUsed();

        uint256 nonce = nonces[g.guardian]++;
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    GRANT_TYPEHASH, g.appId, g.subject, g.receiptHash, uint8(g.ageBand), g.expiresAt, g.requestId, nonce
                )
            )
        );
        if (!SignatureChecker.isValidSignatureNow(g.guardian, digest, signature)) revert BadSignature();

        consentId = keccak256(abi.encode(g.guardian, g.appId, g.subject, nonce));
        _consents[consentId] = Consent({
            guardian: g.guardian,
            appId: g.appId,
            subject: g.subject,
            receiptHash: g.receiptHash,
            ageBand: g.ageBand,
            grantedAt: uint64(block.timestamp),
            expiresAt: g.expiresAt,
            revokedAt: 0,
            scopes: g.scopes
        });
        _guardianConsents[g.guardian].push(consentId);
        if (g.requestId != bytes32(0)) consentByRequest[g.requestId] = consentId;
        emit ConsentGranted(consentId, g.guardian, g.appId, g.subject, g.receiptHash, g.ageBand, g.expiresAt, g.scopes);
    }

    function revoke(bytes32 consentId, bytes calldata signature) external {
        Consent storage c = _consents[consentId];
        if (c.guardian == address(0)) revert UnknownConsent();
        if (c.revokedAt != 0) revert AlreadyRevoked();

        uint256 nonce = nonces[c.guardian]++;
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(REVOKE_TYPEHASH, consentId, nonce)));
        if (!SignatureChecker.isValidSignatureNow(c.guardian, digest, signature)) revert BadSignature();

        c.revokedAt = uint64(block.timestamp);
        emit ConsentRevoked(consentId, c.guardian, c.appId);
    }

    function getConsent(bytes32 consentId) external view returns (Consent memory) {
        return _consents[consentId];
    }

    function consentsOf(address guardian) external view returns (bytes32[] memory) {
        return _guardianConsents[guardian];
    }

    /// @notice What a relying app calls before processing a child's data.
    function isValid(bytes32 consentId, bytes32 appId, bytes32 subject) external view returns (bool) {
        Consent storage c = _consents[consentId];
        return c.guardian != address(0) && c.appId == appId && c.subject == subject && c.revokedAt == 0
            && c.expiresAt > block.timestamp && guardianVerifiedAt[c.guardian] != 0;
    }
}
