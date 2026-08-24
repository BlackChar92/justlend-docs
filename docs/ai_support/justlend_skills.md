---
title: JustLend Skills
description: "GitHub-distributed JustLend Skills — 6 workflow modules plus a bundled 9-tool read-only MCP server for AI agents. CLI also available."
---

# JustLend Skills

**GitHub**: [https://github.com/justlend/justlend-skills](https://github.com/justlend/justlend-skills)

JustLend Skills is a GitHub-distributed AI Agent skills project for the **JustLend DAO** protocol on TRON. Its local package identifier is `@justlend/justlend-skills`. It provides structured skill instructions and a lightweight **read-only** [MCP server](https://modelcontextprotocol.io/) (9 query tools) that enables AI agents (Claude Code, Claude Desktop, Cursor, Codex, etc.) to query market data, monitor account positions, and analyze DeFi lending information.

**Current version:** `1.1.1` · bundled MCP output schema: `1.0.0`

!!! important "Install from GitHub, not the npm registry"
    `@justlend/justlend-skills` is **not currently published to npm**. The scoped name identifies the cloned project for local tooling; it is not an installable registry package. Clone the [GitHub repository](https://github.com/justlend/justlend-skills) and run `bash install.sh`. Do **not** run `npm install @justlend/justlend-skills`.

It also works as a standalone **CLI tool** for quick market checks directly from the terminal.

!!! note
    The bundled MCP server and standalone CLI are **read-only** and never sign transactions. The package's workflow skill files also cover writes such as lending, staking, energy rental/direct purchase, and governance; those actions route to the full MCP server: [@justlend/mcp-server-justlend](mcp_server.md), require a signing wallet, and require explicit confirmation.

!!! note "Bundled server is read-only V1; V2 (Moolah) needs the full server"
    The **bundled lite MCP server** (the 9 query tools) is **read-only JustLend V1** (the Compound V2-style pooled markets). The package also ships workflow modules whose execution is not part of the lite server — `justlend-lending-v2`, `justlend-trx-staking`, `justlend-energy-rental`, `justlend-energy-purchase`, and `justlend-governance-v1` require the [full MCP server](mcp_server.md). To *query* V2 (Moolah) read-only (vault APY/TVL, market parameters, user positions, liquidation candidates), use the full server's read-only `get_moolah_*` tools — e.g. `get_moolah_vaults`, `get_moolah_markets`, `get_moolah_user_position`, `get_moolah_dashboard` — documented in [MCP Server → JustLend V2 (Moolah)](mcp_server.md). Those read tools require no wallet; only the V2 *write* tools do.

!!! tip "Companion references for agents using these tools"
    The tool outputs use protocol-specific terminology — `mantissa`, `borrowIndex`, `exchangeRate`, `collateralFactor`, `closeFactor`, `liquidationIncentive`, `status: active|legacy`. Each is defined in the [Glossary](../resources/glossary.md) with units and on-chain encoding. When asking the agent to *act* on a market (e.g. supply, repay), point it at [Common Pitfalls](../developers/common_pitfalls.md) first — the same gotchas (USDT `approve()` race, decimals mismatch, etc.) apply whether the agent uses Skills, the full MCP server, or raw TronWeb.

## Overview

[JustLend DAO](https://justlend.org) is the largest lending protocol on TRON, based on the Compound V2 architecture. JustLend Skills wraps the core query functionality into MCP tools and structured skill instructions that AI agents can use.

### Key Capabilities

- **Market Data**: Real-time APYs (including mining rewards), TVL, utilization rates for all markets
- **Protocol Dashboard**: Total supply, borrow volume, TVL, and user count across the protocol
- **Account Analysis**: Health factor monitoring, liquidation risk assessment, balance queries
- **Token Balances**: Query native TRX and TRC20 token balances (USDT, USDD, USDC, BTC, ETH, SUN, WIN, etc.)
- **Token Allowances**: Check TRC20 approval status for JustLend contracts

### Skill Modules

The project includes 6 structured skill modules in the `/skills` directory that provide AI agents with domain-specific instructions and workflows:

| Skill | Description | MCP Server Required |
|-------|-------------|---------------------|
| **justlend-lending-v1** | V1 lending queries and supply/borrow/repay/withdraw workflows | Built-in for reads; Full MCP for writes |
| **justlend-lending-v2** | JustLend V2 (Moolah) isolated markets + ERC4626 vaults: supply/borrow/liquidate | Full MCP Server |
| **justlend-trx-staking** | Stake TRX for sTRX liquid staking tokens | Full MCP Server |
| **justlend-energy-rental** | Rent TRON Energy at discounted rates (50-80% cheaper) | Full MCP Server |
| **justlend-energy-purchase** | Quote, confirm, track, and reconcile direct Energy purchases | Full MCP Server |
| **justlend-governance-v1** | View proposals, deposit JST for voting power, cast votes | Full MCP Server |

The read-only portions of `justlend-lending-v1` work with the built-in 9 query tools. Its write flows and the other five skills require the [full MCP server](mcp_server.md) for tool execution.

## Bundled Market Shortcuts

!!! warning "Not an exhaustive market list"
    The table below lists the **8 static shortcuts** used by the bundled `get_token_balance` and `check_allowance` implementations. It is **not** the protocol's full market roster. The JustLend DAO protocol exposes **18 active + 6 legacy = 24 markets total**, including active `jU`. `get_all_markets` queries the visible live inventory; `get_supported_markets` returns only these 8 shortcuts. Use the full MCP server or `contracts.json` for the complete static address catalog.

**Single source of truth for the live market list (in order of preference):**

1. **Live API** — `GET https://openapi.just.network/lend/jtoken` returns the authoritative jToken list with addresses, APYs, and TVL.
2. **Machine-readable address book** — [`/developers/contracts.json`](../developers/contracts.json) (regenerated from the MCP server's `chains.ts`).
3. **Rendered table** — [APIs §2 — jToken Address Reference](../developers/apis.md#2-jtoken-address-reference) (all 24 markets, legacy rows tagged).

| Shortcut | jToken | Underlying | Status / purpose |
|----------|--------|------------|------------------|
| `TRX` | jTRX | TRX | Active; native balance, no allowance |
| `USDT` | jUSDT | USDT | Active shortcut |
| `USDD` | jUSDD | USDD | Active shortcut |
| `USDC` | jUSDCOLD | USDCOLD | Legacy compatibility shortcut |
| `BTC` | jBTC | BTC | Active shortcut |
| `ETH` | jETH | ETH | Active shortcut |
| `SUN` | jSUN | SUN | Active shortcut |
| `WIN` | jWIN | WIN | Active shortcut |

Markets currently **closed** to new supply/borrow (legacy, queryable but do not direct new deposits to them): `jUSDCOLD`, `jUSDDOLD`, `jUSDJ`, `jWBTT`, `jSUNOLD`, `jBUSDOLD`.

## Prerequisites

- [Node.js](https://nodejs.org/) 20.0.0 or higher
- [TronGrid API key](https://www.trongrid.io/) (required)

## Installation from GitHub

```bash
git clone https://github.com/justlend/justlend-skills.git
cd justlend-skills
bash install.sh
```

Or install the cloned repository's dependencies manually:

```bash
npm install
npm test               # offline MCP schema/version/error-contract checks
npm run test:smoke     # live 24-market inventory drift check
```

The `npm install` command above must be run **inside the cloned repository**; it does not install `@justlend/justlend-skills` from npm. The `install.sh` script installs those dependencies, creates `.env`, and prompts for your TronGrid API key.

## Configuration

Create a `.env` file (or use `install.sh`):

```env
# Required — get from https://www.trongrid.io/
TRONGRID_API_KEY=your_trongrid_api_key

# Network: mainnet (default) or nile (testnet)
NETWORK=mainnet
```

### Client Configuration

!!! tip "Resolving the install path"
    The MCP config snippets below use `/ABSOLUTE_PATH_TO/justlend-skills/...` as a placeholder. Replace it with the absolute path of the directory you cloned into. From inside the cloned repo, the absolute path to the server entry script is just:

    ```bash
    echo "$(pwd)/scripts/mcp_server.mjs"
    ```

    For a one-step install on macOS / Linux, the following command edits Claude Desktop's config in place using `jq` (after you have cloned the repo and `cd`-ed into it):

    ```bash
    JL_DIR="$(pwd)"
    CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    mkdir -p "$(dirname "$CONFIG")"
    [ -f "$CONFIG" ] || echo '{"mcpServers":{}}' > "$CONFIG"
    jq --arg cmd node --arg arg "$JL_DIR/scripts/mcp_server.mjs" --arg key "${TRONGRID_API_KEY:?set TRONGRID_API_KEY first}" \
       '.mcpServers.justlend = {command:$cmd, args:[$arg], env:{TRONGRID_API_KEY:$key}}' \
       "$CONFIG" > "$CONFIG.tmp" && mv "$CONFIG.tmp" "$CONFIG"
    ```

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "justlend": {
      "command": "node",
      "args": ["/ABSOLUTE_PATH_TO/justlend-skills/scripts/mcp_server.mjs"],
      "env": {
        "TRONGRID_API_KEY": "your_key"
      }
    }
  }
}
```

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "justlend": {
      "command": "node",
      "args": ["/ABSOLUTE_PATH_TO/justlend-skills/scripts/mcp_server.mjs"],
      "env": {
        "TRONGRID_API_KEY": "your_key"
      }
    }
  }
}
```

#### Claude Code

Add to `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "justlend": {
      "command": "node",
      "args": ["/ABSOLUTE_PATH_TO/justlend-skills/scripts/mcp_server.mjs"],
      "env": {
        "TRONGRID_API_KEY": "your_key"
      }
    }
  }
}
```

#### Codex CLI

```bash
git clone https://github.com/justlend/justlend-skills ~/.codex/justlend-skills
cd ~/.codex/justlend-skills && bash install.sh
mkdir -p ~/.agents/skills
ln -s ~/.codex/justlend-skills/skills ~/.agents/skills/justlend-skills
```

## Usage

### MCP Server Mode

For AI agent integrations (Claude Desktop, Cursor, Claude Code, etc.):

```bash
npm start
```

The server communicates over stdio and exposes 9 read-only MCP tools.

### CLI Tool Mode

For quick checks directly from the terminal:

```bash
node scripts/justlend_api.mjs markets              # List all markets with APY
node scripts/justlend_api.mjs dashboard            # Protocol dashboard (TVL, users)
node scripts/justlend_api.mjs supported-markets    # List 8 bundled shortcuts & addresses
node scripts/justlend_api.mjs balance <addr>       # Check TRX balance
node scripts/justlend_api.mjs balance <addr> USDT  # Check token balance
node scripts/justlend_api.mjs account <addr>       # Account health status
node scripts/justlend_api.mjs account-api <addr>   # Full account data from API
node scripts/justlend_api.mjs jtoken-details <jtoken>  # Detailed jToken info
node scripts/justlend_api.mjs allowance <addr> USDT    # Check TRC20 approval
```

## Skills Reference

### JustLend Lending (justlend-lending-v1)

Core lending skill providing market queries, account analysis, and health factor monitoring workflows.

**Workflow Rules:**

1. **Always check before advising** — use `get_all_markets` for APYs, `get_account_summary` for health factor, and `get_trx_balance` / `get_token_balance` to verify balances
2. **TRC20 approval awareness** — use `check_allowance` to check approval status before recommending supply or repay operations
3. **Risk assessment** — call `get_account_summary` to evaluate liquidation risk; warn if `shortfallUSD > 0`

### sTRX Staking (justlend-trx-staking)

Liquid staking skill for TRX. Stake TRX to receive sTRX tokens that earn staking rewards automatically while remaining usable in DeFi.

!!! note
    This skill requires the [full MCP server](mcp_server.md) for tool execution.

**How it works:** Deposit TRX → receive sTRX → rewards accrue via exchange rate appreciation → unstake with ~14 day unbonding period.

### Energy Rental (justlend-energy-rental)

Rent TRON Energy from the JustLend marketplace at 50-80% lower cost than burning TRX for transaction fees.

!!! note
    This skill requires the [full MCP server](mcp_server.md) for tool execution.

### Energy Direct Purchase (justlend-energy-purchase)

Obtain an authoritative quote, confirm the exact `total_sun` payment, submit it for backend-controlled broadcast, track token-bearing orders, recover tokenless results through public payer history, and reconcile ambiguous payment results before initiating another purchase.

!!! warning
    This skill requires the [full MCP server](mcp_server.md) and a signing wallet. Mainnet uses the official `https://tegrow.ablesdxd.link` endpoint by default; a custom/test or non-mainnet service must be configured explicitly. Never expose a private key or signed transaction in tool output. The full server may retain the exact signed request in a local mode-`0600` recovery file after an ambiguous submission; never retry with a second payment while payment risk is unresolved.

### DAO Governance (justlend-governance-v1)

Participate in JustLend DAO governance proposals. Deposit JST for voting power (1 JST = 1 Vote), cast votes, and reclaim votes after proposals end.

!!! note
    This skill requires the [full MCP server](mcp_server.md) for tool execution.

**Voting Workflow:**

1. `get_proposal_list` — find active proposals
2. `get_vote_info` — check available voting power
3. If no votes: `approve_jst_for_voting` → `deposit_jst_for_votes`
4. `cast_vote` — vote FOR or AGAINST
5. After proposal ends: `withdraw_votes_from_proposal` → `withdraw_votes_to_jst`

## MCP Tools Reference

### Tools (9 total, all read-only)

Every tool declares both `inputSchema` and `outputSchema`. For backward compatibility, successful calls keep the raw result as JSON text in `content[0].text`; schema-aware clients should consume `structuredContent`:

```json
{
  "schemaVersion": "1.0.0",
  "tool": "get_all_markets",
  "result": []
}
```

Pin schema major `1`. Input types and required flags come from each tool's `inputSchema`; all current arguments are strings and unknown properties are rejected.

| Tool | Input (· required) | Output (key fields) |
|------|--------------------|---------------------|
| `get_all_markets` | _(none)_ | Array of markets — `symbol`, `supplyAPY`, `borrowAPY`, `miningAPY`, `tvl`, `totalSupply`, `totalBorrow` |
| `get_dashboard` | _(none)_ | Protocol overview — `totalSupplyUSD`, `totalBorrowUSD`, `tvlUSD`, `userCount` |
| `get_supported_markets` | _(none)_ | 8-shortcut array — `symbol`, `jToken`, `underlying`, `decimals`, `isNative` |
| `get_jtoken_details` | `jtokenAddr` · **required** | jToken detail — interest-rate-model params, `reserves`, `utilization`, mining rewards |
| `get_account_summary` | `address` · **required** | `healthFactor`, `liquidityUSD`, `shortfallUSD`, `totalSupplyUSD`, `totalBorrowUSD`, `positions[]` |
| `get_account_data_from_api` | `address` · **required** | Comprehensive account data — `positions[]`, accrued `rewards`, per-market balances |
| `get_trx_balance` | `address` · **required** | `{ address, balance }` — `balance` human-readable, e.g. `"123.456789 TRX"` |
| `get_token_balance` | `address` · **required**, `token` · **required** | `{ address, token, balance }` — `token` is a symbol (USDT, USDD, …); `balance` in token units |
| `check_allowance` | `address` · **required**, `asset` · **required** | `{ asset, allowance, needsApproval, note }`; native TRX → `allowance: "Infinity", needsApproval: false` |

> The bundled schema currently enforces JSON-string types and required fields, not a Base58 regex. Callers should still supply a valid Base58 TRON address (`T…`, 34 chars). `token`/`asset` are one of the 8 shortcut symbols resolved internally; `jtokenAddr` is a jToken contract address.

### Error Handling

Tool failures return a versioned structured error rather than throwing — the client sees `isError: true`, and the same JSON object appears in text and `structuredContent`:

```json
{
  "schemaVersion": "1.0.0",
  "tool": "get_all_markets",
  "error": "HTTP 429 rate limit",
  "errorCode": "rate_limit",
  "retryable": true,
  "hint": "Retry this read after exponential backoff and respect any Retry-After value."
}
```

Stable codes and how to recover:

| `errorCode` | Retryable | Agent action |
|-------------|:---------:|--------------|
| `invalid_input` | No | Correct the tool name, address, or shortcut symbol before retrying. |
| `authentication` | No | Set a valid local `TRONGRID_API_KEY`, then retry. |
| `rate_limit` | Yes | Back off exponentially and respect `Retry-After`. |
| `transient` | Yes | Retry the read with exponential backoff. |
| `internal` | No | Inspect server stderr and arguments; do not loop automatically. |

All tools are read-only, so a failure never leaves partial on-chain state. Even so, auto-retry only when `retryable: true`; corrective errors should not be repeated unchanged.

## Security

- **Read-Only**: All tools use read-only contract calls (`triggerConstantContract`) or HTTP API queries. No transaction signing or state modifications.
- **API Key Only**: Only requires a TronGrid API key for blockchain read access. No wallet or private key needed.
- **Test First**: Use Nile testnet (`NETWORK=nile`) to verify queries before mainnet.

## Example Conversations

**"What are the best supply rates on JustLend?"**
→ AI calls `get_all_markets`, sorts by supply APY (includes mining rewards), presents ranking

**"Show me the JustLend protocol stats"**
→ AI calls `get_dashboard`, displays total TVL, supply/borrow volume, user count

**"Check if my position is safe"**
→ AI calls `get_account_summary`, analyzes health factor, warns if `shortfallUSD > 0`

**"Check my full position with mining rewards"**
→ AI calls `get_account_data_from_api` for comprehensive position details including rewards

**"What is the TRX balance of address TXxx...?"**
→ AI calls `get_trx_balance`, returns balance

**"How much USDT do I have?"**
→ AI calls `get_token_balance` with token=USDT, returns balance

**"Show me detailed info for the jUSDT market"**
→ AI calls `get_jtoken_details`, returns interest rate model, reserves, utilization, mining rewards

**"What markets have mining rewards?"**
→ AI calls `get_all_markets`, filters by miningAPY > 0, presents markets with active rewards

## Troubleshooting

### TronGrid API Errors

Verify your `TRONGRID_API_KEY` is valid and not rate-limited. Get a key from [trongrid.io](https://www.trongrid.io/).

### Invalid Address

Ensure the address is a valid TRON base58 address (starts with `T`, 34 characters).
