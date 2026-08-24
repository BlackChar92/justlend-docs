---
title: JustLend CLI and V2 SDK
description: Official source-installable JustLend CLI and V2 utility library for deterministic terminal automation and embedded TRON application integrations, with JSON, exit-code, signing, and safety guidance.
tags:
  - justlend
  - cli
  - sdk
  - tronweb
  - automation
  - ai-support
---

# JustLend CLI and V2 SDK

JustLend provides two source-distributed integration surfaces in addition to the HTTP API, MCP server, and Skills package:

| Surface | Repository | Current version | Best for | Side effects |
|---------|------------|-----------------|----------|--------------|
| **JustLend CLI** | [`justlend/justlend-cli`](https://github.com/justlend/justlend-cli) | `1.0.1` | Deterministic terminal automation, CI jobs, dry-run transaction simulation, and machine-readable command output. | Mix of read-only and signing/broadcast commands; inspect the command class and simulate first. |
| **JustLend V2 Utils** | [`justlend/justlend-utils-v2`](https://github.com/justlend/justlend-utils-v2) | `1.0.0` | Embedding V2 vault, lending, liquidation, mining, WTRX, and energy-purchase flows in browser or Node.js applications. | Many exported methods build, sign, or broadcast transactions through the injected `TronWeb` instance. |

Neither project is currently published to npm. Install from the official GitHub source rather than guessing an npm package name.

## CLI: deterministic terminal automation

```bash
git clone https://github.com/justlend/justlend-cli.git
cd justlend-cli
npm ci
npm run build
npm link
justlend --help
```

The CLI exposes 30 top-level command groups covering V1 and V2 lending, vaults, account positions, liquidation, sTRX and stUSDT staking, WTRX, energy rental, governance, mining, rewards, history, portfolio analysis, and transaction simulation.

### Agent contract

- Add `--json` for exactly one machine-readable success or error envelope, including parser and usage failures. Do not parse colorized human tables.
- Branch on the process exit code: `0` for success, non-zero for usage, validation, transport, simulation, signing, or broadcast failures.
- Pin output schema major `1`: success is `{ schemaVersion: "1.0.0", success: true, data }`; failure is `{ schemaVersion, success: false, error, code, retryable, hint? }`.
- Validate output with [`schemas/output-v1.schema.json`](https://github.com/justlend/justlend-cli/blob/main/schemas/output-v1.schema.json). Treat `retryable` as the retry signal; never blindly retry a write.
- Use `--dry-run --dry-run-owner <address>` first. Dry-run simulates and never signs or broadcasts.
- Use `--no-broadcast` for sign-only validation, then broadcast only after explicit human intent.
- Energy direct purchase is the exception: it rejects `--no-broadcast` because the configured backend controls broadcast. Use `energy purchase quote` or `--dry-run` before the explicitly confirmed purchase instead.
- Mainnet energy purchase uses the official `https://tegrow.ablesdxd.link` service by default. Nile requires an explicit matching custom `--energy-api-url`; the CLI rejects the production service on non-mainnet, including `buy --dry-run`.
- Use `energy purchase history <payer>` to recover public in-progress/settled orders. An ambiguous result may retain the exact signed request in the local mode-`0600` risk file; it is redacted from output and blocks another payment until history reconciliation clears it.
- In non-interactive or JSON mode, writes require `--yes`; that flag bypasses the local prompt and must not be added automatically.
- Prefer `--network nile` for integration tests. Mainnet writes are irreversible.

```bash
# Read-only, machine-readable
justlend --json --network mainnet market list

# No signer and no broadcast
justlend --json --network nile --dry-run \
  --dry-run-owner TYourAddress... strx stake 0.000001
```

See the repository README for the complete command tree, response schema, retry policy, and side-effect classification.

## V2 Utils: embedded application integration

```bash
npm install github:justlend/justlend-utils-v2
# or: pnpm add github:justlend/justlend-utils-v2
```

Inject a ready `TronWeb` instance before calling contract helpers. In Node.js, also set the sender explicitly:

```js
import { TronWeb } from 'tronweb';
import { tronObj } from 'justlend-v2-utils';

const tronWeb = new TronWeb({
  fullHost: 'https://nile.trongrid.io',
  privateKey: process.env.PRIVATE_KEY,
});

tronObj.tronWeb = tronWeb;
tronObj.defaultAccount = tronWeb.defaultAddress.base58;
tronObj.network = 'nile';
```

### Agent safety rules

1. Never invent contract addresses or market parameters. Resolve them from the live API, MCP tools, or [`contracts.json`](../developers/contracts.json).
2. Preserve amounts as decimal strings or `BigNumber` values; do not route token amounts through JavaScript `number`.
3. Inspect whether a helper is read-only or creates a transaction before calling it. `depositToVault`, `supplyCollateral`, `borrow`, `repay`, `liquidate`, `multiClaim`, and energy `purchase()` are write paths.
4. Keep private keys, signed transactions, and wallet session material out of prompts, logs, and tool output.
5. Use Nile and a non-production wallet for tests. Require explicit human confirmation immediately before a Mainnet signature or broadcast.
6. For energy purchases, use the official service only on mainnet, configure a matching service on non-mainnet, and preserve durable payment-risk state; never fabricate pricing or payment-address fallbacks.

## Which integration surface should an agent choose?

| Need | Use |
|------|-----|
| Public read-only HTTP data | [OpenAPI](../developers/apis/justlend_apis.yaml) |
| Wallet-aware agent tools with discoverable schemas | [Full MCP server](mcp_server.md) |
| Read-only reusable agent instructions | [JustLend Skills](justlend_skills.md) |
| Reproducible shell/CI automation | **JustLend CLI** |
| Embedded browser or Node.js contract integration | **JustLend V2 Utils** |
| Deployed addresses and ABI lookup | [`contracts.json`](../developers/contracts.json) + [JSON ABIs](../developers/abis/index.md) |
