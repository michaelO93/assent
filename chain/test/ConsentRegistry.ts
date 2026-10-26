import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { encodeAbiParameters, keccak256, parseAbiParameters, toHex, getAddress, type Hex } from "viem";

const APP_ID = keccak256(toHex("doodle-quest"));
const OTHER_APP = keccak256(toHex("other-app"));
const SUBJECT = keccak256(toHex("child-secret|doodle-quest"));
const RECEIPT = keccak256(toHex('{"receipt":"demo"}'));
const SCOPES = "profile.nickname,progress.save,voice.disabled";
const ZERO = `0x${"0".repeat(64)}` as Hex;

function input(f: Fixture, expiresAt: bigint, requestId: Hex = ZERO) {
  return {
    guardian: f.guardian.account.address,
    appId: APP_ID,
    subject: SUBJECT,
    receiptHash: RECEIPT,
    ageBand: 0,
    expiresAt,
    requestId,
    scopes: SCOPES,
  } as const;
}

async function deploy() {
  const [attestor, guardian, relayer, stranger] = await hre.viem.getWalletClients();
  const registry = await hre.viem.deployContract("ConsentRegistry", [attestor.account.address]);
  const chainId = await (await hre.viem.getPublicClient()).getChainId();
  const domain = { name: "Assent", version: "1", chainId, verifyingContract: registry.address } as const;
  const asRelayer = await hre.viem.getContractAt("ConsentRegistry", registry.address, {
    client: { wallet: relayer },
  });
  return { registry, asRelayer, attestor, guardian, relayer, stranger, domain };
}

type Fixture = Awaited<ReturnType<typeof deploy>>;

async function signGrant(f: Fixture, signer = f.guardian, nonce = 0n, expiresAt?: bigint, requestId: Hex = ZERO) {
  const exp = expiresAt ?? BigInt(await time.latest()) + 365n * 86400n;
  const signature = await signer.signTypedData({
    domain: f.domain,
    types: {
      Grant: [
        { name: "appId", type: "bytes32" },
        { name: "subject", type: "bytes32" },
        { name: "receiptHash", type: "bytes32" },
        { name: "ageBand", type: "uint8" },
        { name: "expiresAt", type: "uint64" },
        { name: "requestId", type: "bytes32" },
        { name: "nonce", type: "uint256" },
      ],
    },
    primaryType: "Grant",
    message: { appId: APP_ID, subject: SUBJECT, receiptHash: RECEIPT, ageBand: 0, expiresAt: exp, requestId, nonce },
  });
  return { signature, exp };
}

async function signRevoke(f: Fixture, consentId: Hex, nonce: bigint, signer = f.guardian) {
  return signer.signTypedData({
    domain: f.domain,
    types: { Revoke: [{ name: "consentId", type: "bytes32" }, { name: "nonce", type: "uint256" }] },
    primaryType: "Revoke",
    message: { consentId, nonce },
  });
}

async function grantConsent(f: Fixture) {
  await f.registry.write.verifyGuardian([f.guardian.account.address, keccak256(toHex("idv-ref-123"))]);
  const { signature, exp } = await signGrant(f);
  const args = [input(f, exp), signature] as const;
  const consentId = (await f.asRelayer.simulate.grant(args)).result;
  await f.asRelayer.write.grant(args);
  return consentId;
}

describe("ConsentRegistry", () => {
  it("lets a relayer record a guardian-signed grant", async () => {
    const f = await loadFixture(deploy);
    const consentId = await grantConsent(f);

    const c = await f.registry.read.getConsent([consentId]);
    expect(getAddress(c.guardian)).to.equal(getAddress(f.guardian.account.address));
    expect(c.receiptHash).to.equal(RECEIPT);
    expect(c.scopes).to.equal(SCOPES);
    expect(await f.registry.read.consentsOf([f.guardian.account.address])).to.deep.equal([consentId]);
    expect(await f.registry.read.isValid([consentId, APP_ID, SUBJECT])).to.equal(true);

    const events = await f.registry.getEvents.ConsentGranted();
    expect(events[0].args.scopes).to.equal(SCOPES);
  });

  it("rejects grants from unverified guardians", async () => {
    const f = await loadFixture(deploy);
    const { signature, exp } = await signGrant(f);
    await expect(
      f.asRelayer.write.grant([input(f, exp), signature]),
    ).to.be.rejectedWith("GuardianNotVerified");
  });

  it("rejects a grant signed by someone other than the guardian", async () => {
    const f = await loadFixture(deploy);
    await f.registry.write.verifyGuardian([f.guardian.account.address, keccak256(toHex("ref"))]);
    const { signature, exp } = await signGrant(f, f.stranger);
    await expect(
      f.asRelayer.write.grant([input(f, exp), signature]),
    ).to.be.rejectedWith("BadSignature");
  });

  it("does not let a signature be replayed", async () => {
    const f = await loadFixture(deploy);
    await f.registry.write.verifyGuardian([f.guardian.account.address, keccak256(toHex("ref"))]);
    const { signature, exp } = await signGrant(f);
    const args = [input(f, exp), signature] as const;
    await f.asRelayer.write.grant(args);
    await expect(f.asRelayer.write.grant(args)).to.be.rejectedWith("BadSignature");
  });

  it("links a grant to the device that requested it, once", async () => {
    const f = await loadFixture(deploy);
    await f.registry.write.verifyGuardian([f.guardian.account.address, keccak256(toHex("ref"))]);
    const requestId = keccak256(toHex("qr-request-1"));
    const { signature, exp } = await signGrant(f, f.guardian, 0n, undefined, requestId);
    const args = [input(f, exp, requestId), signature] as const;
    const consentId = (await f.asRelayer.simulate.grant(args)).result;
    await f.asRelayer.write.grant(args);
    expect(await f.registry.read.consentByRequest([requestId])).to.equal(consentId);

    const again = await signGrant(f, f.guardian, 1n, undefined, requestId);
    await expect(f.asRelayer.write.grant([input(f, again.exp, requestId), again.signature])).to.be.rejectedWith(
      "RequestAlreadyUsed",
    );
  });

  it("rejects a relayer swapping in a different request id", async () => {
    const f = await loadFixture(deploy);
    await f.registry.write.verifyGuardian([f.guardian.account.address, keccak256(toHex("ref"))]);
    const { signature, exp } = await signGrant(f, f.guardian, 0n, undefined, keccak256(toHex("parent-approved")));
    await expect(
      f.asRelayer.write.grant([input(f, exp, keccak256(toHex("attacker-device"))), signature]),
    ).to.be.rejectedWith("BadSignature");
  });

  it("only accepts revocation signed by the guardian", async () => {
    const f = await loadFixture(deploy);
    const consentId = await grantConsent(f);

    const forged = await signRevoke(f, consentId, 1n, f.stranger);
    await expect(f.asRelayer.write.revoke([consentId, forged])).to.be.rejectedWith("BadSignature");

    const sig = await signRevoke(f, consentId, 1n);
    await f.asRelayer.write.revoke([consentId, sig]);
    expect(await f.registry.read.isValid([consentId, APP_ID, SUBJECT])).to.equal(false);
    await expect(f.asRelayer.write.revoke([consentId, sig])).to.be.rejectedWith("AlreadyRevoked");
  });

  it("is invalid for the wrong app, the wrong child, after expiry, or once the guardian is unverified", async () => {
    const f = await loadFixture(deploy);
    const consentId = await grantConsent(f);

    expect(await f.registry.read.isValid([consentId, OTHER_APP, SUBJECT])).to.equal(false);
    expect(await f.registry.read.isValid([consentId, APP_ID, keccak256(toHex("other-child"))])).to.equal(false);

    await f.registry.write.unverifyGuardian([f.guardian.account.address]);
    expect(await f.registry.read.isValid([consentId, APP_ID, SUBJECT])).to.equal(false);
    await f.registry.write.verifyGuardian([f.guardian.account.address, keccak256(toHex("ref2"))]);
    expect(await f.registry.read.isValid([consentId, APP_ID, SUBJECT])).to.equal(true);

    await time.increase(366 * 86400);
    expect(await f.registry.read.isValid([consentId, APP_ID, SUBJECT])).to.equal(false);
  });

  it("verifies a guardian from a CRE report delivered by the configured forwarder", async () => {
    const f = await loadFixture(deploy);
    const forwarder = f.stranger;
    const report = encodeAbiParameters(parseAbiParameters("address guardian, bytes32 evidenceHash"), [
      f.guardian.account.address,
      keccak256(toHex("idv-session-ref")),
    ]);
    const asForwarder = await hre.viem.getContractAt("ConsentRegistry", f.registry.address, {
      client: { wallet: forwarder },
    });

    await expect(asForwarder.write.onReport(["0x", report])).to.be.rejectedWith("NotForwarder");
    await f.registry.write.setCreForwarder([forwarder.account.address]);
    await asForwarder.write.onReport(["0x", report]);

    expect(await f.registry.read.guardianVerifiedAt([f.guardian.account.address])).to.not.equal(0n);
    expect(getAddress(await f.registry.read.guardianVerifiedBy([f.guardian.account.address]))).to.equal(
      getAddress(forwarder.account.address),
    );
    await expect(f.asRelayer.write.onReport(["0x", report])).to.be.rejectedWith("NotForwarder");
  });

  it("emits a verification request for the CRE workflow and advertises IReceiver", async () => {
    const f = await loadFixture(deploy);
    const ref = keccak256(toHex("session"));
    await f.asRelayer.write.requestVerification([f.guardian.account.address, ref]);
    const events = await f.registry.getEvents.VerificationRequested();
    expect(events[0].args.sessionRef).to.equal(ref);
    // IReceiver.onReport(bytes,bytes) selector, and IERC165
    expect(await f.registry.read.supportsInterface(["0x805f2132"])).to.equal(true);
    expect(await f.registry.read.supportsInterface(["0x01ffc9a7"])).to.equal(true);
  });

  it("restricts guardian verification to the attestor", async () => {
    const f = await loadFixture(deploy);
    const asStranger = await hre.viem.getContractAt("ConsentRegistry", f.registry.address, {
      client: { wallet: f.stranger },
    });
    await expect(
      asStranger.write.verifyGuardian([f.stranger.account.address, keccak256(toHex("x"))]),
    ).to.be.rejectedWith("NotAttestor");
  });
});
