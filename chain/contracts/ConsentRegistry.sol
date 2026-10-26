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

    bytes32 private constant GRANT_TYPEHASH = keccak256(
        "Grant(bytes32 appId,bytes32 subject,bytes32 receiptHash,uint8 ageBand,uint64 expiresAt,uint256 nonce)"
    );
    bytes32 private constant REVOKE_TYPEHASH = keccak256("Revoke(bytes32 consentId,uint256 nonce)");

    address public attestor;
    mapping(address => uint64) public guardianVerifiedAt;
    mapping(address => uint256) public nonces;
    mapping(bytes32 => Consent) private _consents;
    mapping(address => bytes32[]) private _guardianConsents;

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

    function grant(
        address guardian,
        bytes32 appId,
        bytes32 subject,
        bytes32 receiptHash,
        AgeBand ageBand,
        uint64 expiresAt,
        string calldata scopes,
        bytes calldata signature
    ) external returns (bytes32 consentId) {
        if (guardianVerifiedAt[guardian] == 0) revert GuardianNotVerified();
        if (expiresAt <= block.timestamp) revert AlreadyExpired();

        uint256 nonce = nonces[guardian]++;
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(GRANT_TYPEHASH, appId, subject, receiptHash, uint8(ageBand), expiresAt, nonce))
        );
        if (!SignatureChecker.isValidSignatureNow(guardian, digest, signature)) revert BadSignature();

        consentId = keccak256(abi.encode(guardian, appId, subject, nonce));
        _consents[consentId] = Consent({
            guardian: guardian,
            appId: appId,
            subject: subject,
            receiptHash: receiptHash,
            ageBand: ageBand,
            grantedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            revokedAt: 0,
            scopes: scopes
        });
        _guardianConsents[guardian].push(consentId);
        emit ConsentGranted(consentId, guardian, appId, subject, receiptHash, ageBand, expiresAt, scopes);
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
