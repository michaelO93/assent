import {
  EVMClient,
  HTTPClient,
  Runner,
  bytesToHex,
  consensusIdenticalAggregation,
  getNetwork,
  handler,
  hexToBase64,
  type EVMLog,
  type NodeRuntime,
  type Runtime,
} from "@chainlink/cre-sdk"
import { decodeEventLog, encodeAbiParameters, keccak256, parseAbi, parseAbiParameters, toBytes } from "viem"

// Assent decentralized identity attestation.
//
// When a parent asks to be verified, ConsentRegistry emits VerificationRequested(guardian, sessionRef).
// Every node in the DON independently asks the identity provider whether that session passed; only if
// they agree does the DON sign a report, which the Chainlink forwarder delivers to the registry's
// onReport(). No single key, including Assent's, decides who counts as a verified adult.

type Config = {
  chainSelectorName: string
  registryAddress: string
  idvApiUrl: string
  gasLimit: string
}

type SessionCheck = { approved: boolean; reference: string }

const registryEvents = parseAbi(["event VerificationRequested(address indexed guardian, bytes32 sessionRef)"])
const VERIFICATION_REQUESTED = keccak256(toBytes("VerificationRequested(address,bytes32)"))

const initWorkflow = (config: Config) => {
  const network = getNetwork({ chainFamily: "evm", chainSelectorName: config.chainSelectorName })
  if (!network) throw new Error(`Unknown chain: ${config.chainSelectorName}`)
  const evm = new EVMClient(network.chainSelector.selector)

  return [
    handler(
      evm.logTrigger({
        addresses: [hexToBase64(config.registryAddress)],
        topics: [{ values: [hexToBase64(VERIFICATION_REQUESTED)] }],
      }),
      onVerificationRequested,
    ),
  ]
}

// Runs on every node: ask the identity provider about this session. The provider's answer is
// deterministic, so identical-result consensus applies.
const checkSession = (node: NodeRuntime<Config>, guardian: string, sessionRef: string): SessionCheck => {
  const http = new HTTPClient()
  const url = `${node.config.idvApiUrl}/${sessionRef}?guardian=${guardian}`
  const resp = http.sendRequest(node, { url, method: "GET" as const }).result()
  if (resp.statusCode !== 200) return { approved: false, reference: sessionRef }
  const body = JSON.parse(new TextDecoder().decode(resp.body)) as { status?: string; adult?: boolean; reference?: string }
  return { approved: body.status === "approved" && body.adult === true, reference: body.reference ?? sessionRef }
}

const onVerificationRequested = (runtime: Runtime<Config>, log: EVMLog): string => {
  const { args } = decodeEventLog({
    abi: registryEvents,
    topics: log.topics.map((t) => bytesToHex(t)) as [`0x${string}`, ...`0x${string}`[]],
    data: bytesToHex(log.data),
  })
  const guardian = args.guardian.toLowerCase()
  runtime.log(`Verification requested for guardian ${guardian}`)

  const check = runtime
    .runInNodeMode(checkSession, consensusIdenticalAggregation<SessionCheck>())(guardian, args.sessionRef)
    .result()
  if (!check.approved) {
    runtime.log("Identity provider did not approve this session; nothing written onchain")
    return "rejected"
  }
  runtime.log("DON agreed: identity provider approved the session")

  // Only a hash of the provider's reference goes onchain, never any identity data.
  const evidenceHash = keccak256(toBytes(`idv:${check.reference}`))
  const payload = encodeAbiParameters(parseAbiParameters("address guardian, bytes32 evidenceHash"), [
    guardian as `0x${string}`,
    evidenceHash,
  ])

  const network = getNetwork({ chainFamily: "evm", chainSelectorName: runtime.config.chainSelectorName })!
  const evm = new EVMClient(network.chainSelector.selector)
  const report = runtime
    .report({ encodedPayload: hexToBase64(payload), encoderName: "evm", signingAlgo: "ecdsa", hashingAlgo: "keccak256" })
    .result()
  const write = evm
    .writeReport(runtime, {
      receiver: runtime.config.registryAddress,
      report,
      gasConfig: { gasLimit: runtime.config.gasLimit },
    })
    .result()

  const txHash = bytesToHex(write.txHash || new Uint8Array(32))
  if (/^0x0+$/.test(txHash)) {
    runtime.log("Dry run: report signed but not broadcast (re-run the simulation with --broadcast)")
  } else {
    runtime.log(`Guardian verified onchain: https://sepolia.basescan.org/tx/${txHash}`)
  }
  return txHash
}

export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}
