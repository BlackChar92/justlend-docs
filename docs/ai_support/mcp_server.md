---
title: JustLend MCP Server (full, read + write)
description: "@justlend/mcp-server-justlend v1.1.3 — 104 MCP tools with versioned output schemas across JustLend V1 and V2, secure energy direct purchase, historical records, general TRON utilities, and encrypted agent-wallet signing."
---

# MCP Server

**GitHub**: [https://github.com/justlend/mcp-server-justlend](https://github.com/justlend/mcp-server-justlend)

## Contents

This page is the human-readable reference for the full MCP server. For agent users who want quick lookups, [`/llms.txt`](../llms.txt) summarizes the same surface in 50 lines. For offline routing and RAG scoring, use the site-local [MCP Tool Catalog](../documents/aidocs/mcp_tools.md), which mirrors the generated `mcp-api-list.md` from the MCP repository.

- [Overview](#overview) — what this server is and how it differs from [Skills](justlend_skills.md).
- [Installation](#installation) — npm, source, and Claude Desktop config.
- [Wallet setup](#wallet-setup-first-use-choice) — encrypted agent-wallet; the legacy unauthenticated browser bridge is currently disabled.
- [HTTP-mode authentication (`MCP_API_KEY`)](#http-mode-authentication-mcp_api_key) — stdio (local clients) is open; HTTP/SSE is fail-closed.
- [Tool catalog (104 tools)](#tools-104-total) — **V1**: Wallet & Network · Market Data · Account & Balances · Lending Operations · Mining & Rewards · JST Voting / Governance · Energy Rental / Direct Purchase · sTRX Staking · Transfers · General TRON. **V2**: Vaults · Markets · Liquidation · Dashboard/History · Mining. Plus Historical Records.
- [Guided prompts](#prompts-ai-guided-workflows) — the 14 shipped MCP prompts (`supply_assets`, `analyze_portfolio`, `cast_vote`, `moolah_supply`, `moolah_borrow`, …).
- [Security considerations](#security-considerations) — `destructiveHint`, dry-run mode, source-of-truth priority, HTTP-mode `MCP_API_KEY`.

!!! tip "AI-agent companion pages"
    For retrieval-optimized answers, start from [AI Docs Index](../documents/aidocs/index.md), [MCP Safety Policy](../documents/aidocs/mcp_safety.md), [Common Questions](../documents/aidocs/common_questions.md), and the [MCP Tool Catalog](../documents/aidocs/mcp_tools.md).

!!! tip "Before integrating"
    Read [Common Pitfalls](../developers/common_pitfalls.md) for the 10 most frequent JustLend-integration foot-guns (USDT `approve()` race condition, `enterMarkets()` requirement, `mint()` overload between jTRX and jTRC20, jToken vs underlying decimals, `liquidateBorrow` 50% close-factor cap, `uint256(-1)` repay sentinel, …). For precise term definitions used throughout the MCP tool descriptions (mantissa, kink, utilization, collateral / close / reserve factor, exchange rate, market `status`), see the [Glossary](../resources/glossary.md). The MCP server enforces several of these patterns internally (e.g. it runs TRC20 allowance checks before supply/repay), but understanding them helps you debug failed transactions and write callers that don't fight the server.

The JustLend MCP Server (`@justlend/mcp-server-justlend`) is a [Model Context Protocol](https://modelcontextprotocol.io/) server that enables AI agents to interact with the **JustLend DAO** protocol on TRON. Supply assets, borrow against collateral, manage positions, rent energy, stake TRX for sTRX, and analyze DeFi portfolios — all through a unified AI interface.

Beyond JustLend-specific operations, the server also exposes a full set of **general-purpose TRON chain utilities** — balance queries, block/transaction data, token metadata, TRX transfers, smart contract reads/writes, staking (Stake 2.0), multicall, and more.

!!! note
    Current version (**v1.1.3**) covers **JustLend V1** *and* **JustLend V2**. V1 is the Compound-V2-style pooled supply/borrow market (jTokens); V2 is an isolated-market + ERC4626-vault protocol. The two surfaces are namespaced — V1 tools like `get_market_data` / `supply`, V2 tools prefixed `moolah_*` / `get_moolah_*` (the `moolah` identifier is V2's on-chain/tool naming). See the [JustLend V2](../developers/justlend_v2.md) developer page for the protocol model and deployed contracts.

!!! tip "v1.1.3 Update"
    **v1.1.3** makes every one of the **104 tools** declare an MCP `outputSchema`. Successful calls preserve legacy text content and also expose `{ schemaVersion: "1.0.0", tool, result }` in `structuredContent`, so agents no longer need to infer output shape from prose. It also adds six fail-closed energy direct-purchase tools for configuration, quote, public payer history, order recovery, configured-wallet payment-risk inspection, and explicitly confirmed purchase; reconciles the V1 inventory to **24 markets (18 active + 6 legacy)**; and restores active `jU` to the product table. The legacy unauthenticated browser-wallet bridge is disabled, so writes use encrypted agent-wallet signing. **v1.1.2** added native **TRX ↔ WTRX** wrap/unwrap (`wrap_trx` / `unwrap_trx`), hardened TRC20 approvals, and added `retryable` error classification. **v1.1.0** introduced the V2 tool and prompt surface.

## Overview

[JustLend DAO](https://justlend.org) is the largest lending protocol on TRON, based on the Compound V2 architecture. This MCP server wraps the full protocol functionality into tools and guided prompts that local MCP clients such as Claude Desktop, Codex, Claude Code, and Cursor can use.

### Key Capabilities

**JustLend Protocol**

- **Market Data**: Real-time APYs, TVL, utilization rates, prices for all markets
    - Smart fallback: contract queries first, API fallback for reliability
    - TTL caching (30–60s) to reduce RPC calls
- **Account Data**: Full position analysis via Multicall3 batch queries on TRON Mainnet (`TX56WKxtja91Dybf2FdN4hZbDLyKVxxhAu`, ~2.5s vs ~8s legacy)
    - Health factor, collateral, borrow positions
    - On-chain Oracle prices with API fallback
- **Batch Wallet Balances**: Query all TRC20 token balances in a single Multicall3 RPC call
- **Mining Rewards**: Advanced mining reward calculation
    - Detailed breakdown by market and reward token (USDD, TRX, WBTC, etc.)
    - Separates new period vs. last period rewards
    - USD value calculation with live token prices
    - Mining status tracking (ongoing/paused/ended) and period end times
    - Nile fallback returns an empty reward set instead of failing when the testnet rewards API is unavailable
- **Supply / Borrow / Repay / Withdraw**: Full lending operations with pre-flight checks
- **Collateral Management**: Enter/exit markets, manage what counts as collateral
- **Portfolio Analysis**: AI-guided risk assessment, health factor monitoring, optimization
- **Token Approvals**: Manage TRC20 approvals for jToken contracts
- **Energy Cost Estimation**: Estimate energy, bandwidth, and TRX cost for any lending operation before executing
- **JST Voting / Governance**: View proposals, cast votes, deposit/withdraw JST for voting power, reclaim votes
- **Energy Rental + Direct Purchase**: Rent energy on-chain, or fetch an authoritative quote and explicitly confirm a separately configured service purchase with payer-scoped recovery and duplicate-payment protection
- **sTRX Staking**: Stake TRX to receive sTRX, unstake sTRX, claim staking rewards, check withdrawal eligibility
    - Precision-safe BigInt/string math for TRX Sun conversion and 18-decimal sTRX balances/exchange-rate display

**Wallet Signing**

- **Encrypted agent-wallet**: The supported signing mode stores encrypted keys under `~/.agent-wallet/` and reads `AGENT_WALLET_PASSWORD` from the server environment
- **Browser bridge disabled**: The legacy loopback browser bridge lacks request-level authentication; `connect_browser_wallet` and browser mode fail closed until an authenticated replacement is available

**General TRON Chain**

- **Balances**: TRX balance (with Sun/TRX conversion), TRC20/TRC1155 token balances
- **Blocks**: Latest block, block by number/hash, block number, chain ID
- **Transactions**: Fetch transaction details, receipts, wait for confirmation
- **Contracts**: Read/write any contract, fetch on-chain ABI, multicall (v2 & v3), deploy, estimate energy
- **Token Metadata**: TRC20 info (name/symbol/decimals/supply), TRC721 metadata, TRC1155 URI
- **Transfers**: Send TRX, transfer TRC20 tokens, approve spenders
- **Staking (Stake 2.0)**: Freeze/unfreeze TRX for BANDWIDTH or ENERGY, withdraw expired unfreeze
- **Address Utilities**: Hex ↔ Base58 conversion, address validation, resolution
- **Wallet**: Sign messages and transactions through encrypted agent-wallet; the unauthenticated browser bridge is disabled

## Supported Markets

The protocol exposes **24 jToken markets in total (18 active + 6 legacy markets)**. This count was verified against the expanded market table at [app.justlend.org](https://app.justlend.org/), the live `/lend/jtoken` API, and the canonical contract directory on 2026-08-19. Call `get_supported_markets` for the live list with addresses. The active markets are:

| jToken     | Underlying | Description |
|------------|-----------|-------------|
| jTRX       | TRX       | Native TRON token |
| jUSDT      | USDT      | Tether USD |
| jUSDD      | USDD      | Decentralized USD (USDD/TRX dual-mining rewards) |
| jUSD1      | USD1      | World Liberty Financial USD |
| jTUSD      | TUSD      | TrueUSD |
| jwstUSDT   | wstUSDT   | Wrapped staked USDT (yields underlying staking APY) |
| jsTRX      | sTRX      | Staked TRX (yields underlying staking APY) |
| jBTC       | BTC       | Bitcoin (wrapped) |
| jWBTC      | WBTC      | Wrapped Bitcoin |
| jETH       | ETH       | Ethereum (wrapped) |
| jETHB      | ETHB      | Bridged Ethereum |
| jSUN       | SUN       | SUN token |
| jJST       | JST       | JUST governance token |
| jWIN       | WIN       | WINkLink |
| jBTT       | BTT       | BitTorrent token |
| jNFT       | NFT       | APENFT |
| jHTX       | HTX       | HTX token |
| jU         | U         | U token |

## Prerequisites

- [Node.js](https://nodejs.org/) 20.0.0 or higher
- Optional: [TronGrid API key](https://www.trongrid.io/) for reliable mainnet access (strongly recommended)

## Installation

```bash
git clone https://github.com/justlend/mcp-server-justlend.git
cd mcp-server-justlend
npm install
```

## Quick Setup

For a guided setup experience (build, configure, generate `.mcp.json`):

```bash
bash scripts/setup-mcp-test.sh
# Add --claude-desktop to also print Claude Desktop JSON
```

The script checks Node.js 20+, installs dependencies, builds the project, and generates local Claude Code config.

## Configuration

### Wallet Setup (First-Use Choice)

On first use, select **agent mode** with `set_wallet_mode` and `mode="agent"`. The legacy browser mode is disabled until its local bridge supports request-level authentication.

Agent-wallet stores encrypted keys under `~/.agent-wallet/`; set `AGENT_WALLET_PASSWORD` in the server environment.

Private keys are **never** stored in environment variables by default.

You can also manage wallets via **CLI** or **MCP tools**:

#### CLI (agent-wallet)
```bash
# Import an existing private key or mnemonic
npx agent-wallet add

# Generate a new wallet
npx agent-wallet generate

# List all wallets
npx agent-wallet list

# Switch active wallet
npx agent-wallet activate <wallet-id>
```

#### MCP Tools (runtime)

| Tool | Description |
|------|-------------|
| `get_wallet_address` | Shows current address, or returns first-use wallet selection guidance |
| `connect_browser_wallet` | Return a safety notice while the unauthenticated browser bridge is disabled |
| `set_wallet_mode` | Select supported `agent` signing; `browser` currently fails closed |
| `get_wallet_mode` | Show agent-wallet status and report legacy browser mode as disabled |
| `list_wallets` | List all wallets with IDs, types, addresses |
| `set_active_wallet` | Switch active wallet by ID |

Importing an existing private key is intentionally not exposed as an MCP tool because MCP arguments can be logged by clients and transports. Use the CLI instead:

```bash
npx agent-wallet import
```

### Environment Variables

```bash
# Required for non-interactive agent-wallet unlock
export AGENT_WALLET_PASSWORD="your_wallet_password"

# Strongly recommended — avoids TronGrid 429 rate limiting on mainnet
export TRONGRID_API_KEY="your_trongrid_api_key"

# Optional: HTTP/SSE transport mode — start it with `npm run start:http`
# (entrypoint is src/server/http-server.ts; there is no transport env toggle)
export PORT="3001"                 # HTTP server port (default: 3001)
export MCP_HOST="127.0.0.1"        # HTTP server host / bind address (default: 127.0.0.1)
export MCP_CORS_ORIGIN=""          # required allow-list if you bind to a non-loopback host

# Required in HTTP mode — see "HTTP Mode Authentication" below for how to generate one
export MCP_API_KEY="your_strong_random_secret"

# Optional energy direct-purchase override; mainnet defaults to https://tegrow.ablesdxd.link
export JUSTLEND_ENERGY_API_URL="https://energy-api.example"
# Custom/test endpoints also require this explicit trust opt-in
export JUSTLEND_ALLOW_UNTRUSTED_HOSTS="1"
```

Energy direct purchase is fail-closed: mainnet uses the official `https://tegrow.ablesdxd.link` service by default, while a non-mainnet signer requires a matching custom service. Load live limits with `get_energy_purchase_config`, obtain an authoritative `quote_energy_purchase`, show the exact payer/receivers/duration/TRX amount, and call `buy_energy_direct` with `confirmPayment=true` only after explicit confirmation. If submission is ambiguous or an idempotent response has no order token, query `get_energy_purchase_history` and then call `get_energy_payment_risk` with no arguments. The risk check is read-only, is scoped to the configured wallet, and never replays a stored payment. Never sign a second payment while the risk list is non-empty; replay/reconciliation is allowed only inside a separately user-confirmed `buy_energy_direct` recovery attempt.

After signing, an ambiguous result may store the exact signed request (signature plus raw transaction) in the local mode-`0600` `~/.mcp-server-justlend/energy-payment-risks.json` recovery file. The request remains broadcastable until expiry, is redacted from MCP output, and is removed only after public history confirms the payment/order or the backend deterministically rejects it before broadcast. `get_energy_payment_risk` only observes this state; it cannot clear or replay the request.

### HTTP Mode Authentication (`MCP_API_KEY`)

**Most users do not need this.** Claude Desktop, Claude Code, and Cursor connect over **stdio** by default, which has no network surface and no auth. `MCP_API_KEY` only applies when you run the server in **HTTP/SSE mode** (`npm run start:http`).

#### What it is

`MCP_API_KEY` is a self-chosen Bearer-token shared secret between the server and its clients. It is **not** issued by Anthropic, JustLend, or any third party — you generate it yourself, set it on the server, and share it with clients you trust.

The HTTP server reads the variable at startup and **refuses to start without it**. Every incoming request to `/sse` and `/messages` must carry an `Authorization: Bearer <MCP_API_KEY>` header — anything else returns `401 Unauthorized`. The `/health` endpoint is the only exception.

##### Version history

The variable name has been around for a while; what changed is how the server treats it. To avoid confusion when reading older deployment guides:

| Version | Behavior |
|---------|----------|
| v1.0.1 – v1.0.3 | `MCP_API_KEY` exists but is **optional**. If unset, the HTTP server starts with no auth (every request is accepted). |
| **v1.0.4** | `MCP_API_KEY` becomes **required**. The server refuses to start without it, returning `MCP_API_KEY is required in HTTP mode. Refusing to start without authentication.` Comparison still uses plain string equality. |
| **v1.0.5** | Comparison upgraded to `crypto.timingSafeEqual` with an explicit length check, closing a timing side-channel. The variable itself is unchanged — same name, same role, same "required" semantics as v1.0.4. |

##### Why the timing-safe upgrade matters

Plain string equality (`provided === expected`) returns at the first byte mismatch. An attacker who can measure response latency — for example, by sending many requests from the same network — can distinguish "first byte matched, second byte mismatched" (slightly slower) from "first byte mismatched" (slightly faster) and recover the secret one byte at a time. Network jitter and CPU noise blunt the signal but do not eliminate it; the [classic demonstration](https://crypto.stanford.edu/~dabo/papers/ssl-timing.pdf) recovers cross-network secrets in hours.

`crypto.timingSafeEqual` compares every byte regardless of where the first mismatch occurs, so the runtime depends only on the input length, not the input content. Length is checked separately because `timingSafeEqual` throws on unequal lengths, and the length of `Bearer <key>` is not itself the secret.

#### When you need it

You need to set `MCP_API_KEY` if any of the following apply:

- You are deploying the MCP server to a remote machine and connecting over SSE.
- You are exposing the server behind a reverse proxy (NGINX, Caddy) on a LAN, container network, or the public internet.
- You are writing or running an MCP client that talks to this server over HTTP rather than over stdio.

If you are simply running Claude Desktop / Claude Code / Cursor against a local stdio server (the default), you can ignore this variable entirely.

#### How to generate one

Generate a strong random string locally — any of the following work:

```bash
# 32 random bytes, base64-encoded (recommended)
openssl rand -base64 32

# Or hex
openssl rand -hex 32

# Or a UUID
uuidgen
```

Set it on the server before starting:

```bash
export MCP_API_KEY="$(openssl rand -base64 32)"
npm run start:http
```

#### How clients send it

Clients pass the same value as a Bearer token on every request:

```http
Authorization: Bearer <your-MCP_API_KEY>
```

For example, a `curl` health-check vs. an authenticated SSE connection:

```bash
# /health does not require the header
curl http://127.0.0.1:3001/health

# /sse requires the Authorization header — without it the server returns 401
curl -N -H "Authorization: Bearer $MCP_API_KEY" http://127.0.0.1:3001/sse
```

#### Security guidelines

- Treat `MCP_API_KEY` like a database password: never commit it to git, never paste it into issue trackers or chat logs, and rotate it if it leaks.
- Use **at least 32 bytes** of entropy. Short or guessable values defeat the purpose.
- Always pair HTTP mode with **TLS** (HTTPS) when the server is reachable from anywhere other than `localhost`. A Bearer token sent over plain HTTP is sent in cleartext on every request.
- Bind to `127.0.0.1` (the default) unless you explicitly need remote access. If you need remote access, terminate TLS at a reverse proxy and only forward to the local port.
- The same key is shared by every client that connects. If you need per-client identities, put a proxy in front of the server that maps client identities to a single back-end key.

### Client Configuration

Build the local server first:

```bash
npm run build
```

All local client examples below use the built stdio entrypoint:

```bash
node /absolute/path/to/mcp-server-justlend/build/index.js
```

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "justlend": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-justlend/build/index.js"],
      "env": {
        "TRONGRID_API_KEY": "SET_VIA_SYSTEM_ENV"
      }
    }
  }
}
```

#### Claude Code

Add to `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "justlend": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-justlend/build/index.js"],
      "env": {
        "TRONGRID_API_KEY": "SET_VIA_SYSTEM_ENV"
      }
    }
  }
}
```

!!! tip
    No `TRON_PRIVATE_KEY` is needed. Configure encrypted agent-wallet and pass `AGENT_WALLET_PASSWORD` through the server environment; browser signing is currently disabled.

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "justlend": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-justlend/build/index.js"],
      "env": {
        "TRONGRID_API_KEY": "SET_VIA_SYSTEM_ENV"
      }
    }
  }
}
```

## Usage

```bash
# Stdio mode (for MCP clients)
npm start

# HTTP/SSE mode (for remote clients)
npm run start:http

# Development with auto-reload
npm run dev
```

## API Reference

### Tools (104 total)

!!! info "V1 + V2"
    The first ten groups below are **JustLend V1** (pooled jToken market). The **JustLend V2** groups (vaults / markets / liquidation / dashboard / mining) and **Historical Records** follow. V2 tools are namespaced `moolah_*` / `get_moolah_*`.

#### Wallet & Network

| Tool | Description | Write? |
|------|-------------|--------|
| `get_wallet_address` | Show wallet address or first-use wallet selection guidance | No |
| `connect_browser_wallet` | Return a safety notice while the unauthenticated browser bridge is disabled | Yes |
| `set_wallet_mode` | Select supported `agent` signing; `browser` currently fails closed | Yes |
| `get_wallet_mode` | Show agent-wallet status and report browser mode as disabled | No |
| `list_wallets` | List all wallets (IDs, types, addresses) | No |
| `set_active_wallet` | Switch active wallet by wallet ID | No |
| `get_supported_networks` | List available networks | No |
| `get_supported_markets` | List all jToken markets with addresses | No |
| `set_network` | Set global default network (mainnet, nile) | Yes |
| `get_network` | Get current global default network | No |

#### Market Data

| Tool | Description | Write? |
|------|-------------|--------|
| `get_market_data` | Detailed data for one market (APY, TVL, rates) — contract + API fallback | No |
| `get_all_markets` | Overview of all markets — contract + API fallback | No |
| `get_protocol_summary` | Comptroller config & protocol parameters — contract query | No |

#### Account & Balances

| Tool | Description | Write? |
|------|-------------|--------|
| `get_account_summary` | Full position: supplies, borrows, health factor — Multicall3 batch | No |
| `check_allowance` | Check TRC20 approval for jToken | No |
| `get_trx_balance` | TRX balance | No |
| `get_token_balance` | TRC20 token balance | No |
| `get_wallet_balances` | Batch-fetch TRC20 balances across multiple markets via Multicall3 | No |

#### Lending Operations

| Tool | Description | Write? |
|------|-------------|--------|
| `supply` | Deposit assets to earn interest | **Yes** |
| `withdraw` | Withdraw supplied assets | **Yes** |
| `withdraw_all` | Withdraw all from a market | **Yes** |
| `borrow` | Borrow against collateral | **Yes** |
| `repay` | Repay outstanding borrows | **Yes** |
| `enter_market` | Enable market as collateral | **Yes** |
| `exit_market` | Disable market as collateral | **Yes** |
| `approve_underlying` | Approve TRC20 for jToken | **Yes** |
| `claim_rewards` | Claim mining rewards | **Yes** |
| `estimate_lending_energy` | Estimate energy/bandwidth/TRX cost for any lending operation | No |

#### Mining & Rewards

| Tool | Description | Write? |
|------|-------------|--------|
| `get_mining_rewards` | Unclaimed mining rewards, APY, and reward breakdown | No |
| `get_usdd_mining_config` | USDD mining periods, reward tokens, and schedule | No |
| `get_wbtc_mining_config` | WBTC supply mining configuration and activity details | No |

#### JST Voting / Governance

| Tool | Description | Write? |
|------|-------------|--------|
| `get_proposal_list` | List all governance proposals with status and vote counts | No |
| `get_user_vote_status` | User's voting history: voted proposals, withdrawable votes | No |
| `get_vote_info` | Voting power: JST balance, available votes, locked votes | No |
| `get_locked_votes` | Votes locked in a specific proposal | No |
| `check_jst_allowance_for_voting` | Check JST approval for WJST voting contract | No |
| `approve_jst_for_voting` | Approve JST for the WJST voting contract | **Yes** |
| `deposit_jst_for_votes` | Deposit JST to get voting power (1 JST = 1 Vote) | **Yes** |
| `withdraw_votes_to_jst` | Withdraw WJST back to JST | **Yes** |
| `cast_vote` | Cast for/against votes on a proposal | **Yes** |
| `withdraw_votes_from_proposal` | Reclaim votes from completed proposals | **Yes** |

#### Energy Rental

| Tool | Description | Write? |
|------|-------------|--------|
| `get_energy_rental_dashboard` | Market data: TRX price, exchange rate, APY, energy per TRX | No |
| `get_energy_rental_params` | On-chain params: fees, limits, pause status, usage charge ratio | No |
| `calculate_energy_rental_price` | Estimate cost for renting energy (prepayment, deposit, daily cost) | No |
| `get_energy_rental_rate` | Current rental rate for a given TRX amount | No |
| `get_user_energy_rental_orders` | User's rental orders (as renter, receiver, or all) | No |
| `get_energy_rent_info` | On-chain rental info for a renter-receiver pair | No |
| `get_return_rental_info` | Return/cancel estimation (refund, remaining rent, daily cost) | No |
| `rent_energy` | Rent energy for a receiver (with balance, pause, limit checks) | **Yes** |
| `return_energy_rental` | Cancel an active rental (with active order check) | **Yes** |
| `get_energy_purchase_config` | Load live direct-purchase limits, durations, prices, and pool capacity | No |
| `quote_energy_purchase` | Obtain an authoritative quote without creating or paying for an order | No |
| `get_energy_purchase_order` | Query an order lifecycle by order ID, with an optional access token | No |
| `get_energy_purchase_history` | Query public in-progress and settled orders by payer address | No |
| `get_energy_payment_risk` | Report configured-wallet payment risks without replaying a signed payment; accepts no arguments | No |
| `buy_energy_direct` | Sign a quote-bound TRX payment after `confirmPayment=true`; configured backend validates and may broadcast | **Yes** |

#### sTRX Staking

| Tool | Description | Write? |
|------|-------------|--------|
| `get_strx_dashboard` | Staking market data: exchange rate, APY, total supply | No |
| `get_strx_account` | User staking account: staked amount, income, rewards | No |
| `get_strx_balance` | sTRX token balance for an address | No |
| `check_strx_withdrawal_eligibility` | Check unbonding status, pending/completed withdrawal rounds | No |
| `stake_trx_to_strx` | Stake TRX to receive sTRX with precision-safe string amount parsing (with balance check) | **Yes** |
| `unstake_strx` | Unstake sTRX to receive TRX back (with balance check) | **Yes** |
| `claim_strx_rewards` | Claim all staking rewards (with rewards existence check) | **Yes** |

#### Transfers

| Tool | Description | Write? |
|------|-------------|--------|
| `transfer_trx` | Transfer TRX to another address (with balance check) | **Yes** |
| `transfer_trc20` | Transfer TRC20 tokens by symbol or contract address | **Yes** |

#### JustLend V2 — Vaults

| Tool | Description | Write? |
|------|-------------|--------|
| `get_moolah_vaults` | List all V2 ERC4626 vaults with APY, TVL, and underlying token | No |
| `get_moolah_vault` | Single vault detail: APY, TVL, allocation, and the user's share balance | No |
| `approve_moolah_vault` | Approve TRC20 for a vault before depositing (not needed for TRX) | **Yes** |
| `moolah_vault_deposit` | Deposit assets into an ERC4626 vault to earn yield | **Yes** |
| `moolah_vault_withdraw` | Withdraw underlying by asset amount (or `max`) | **Yes** |
| `moolah_vault_redeem` | Redeem shares for underlying (or `max`) | **Yes** |

#### JustLend V2 — Markets

| Tool | Description | Write? |
|------|-------------|--------|
| `get_moolah_markets` | List V2 markets: borrow/supply APY, LLTV, utilization, liquidity | No |
| `get_moolah_market` | Single market detail by `marketId` (bytes32 hex) | No |
| `get_moolah_user_position` | User position in a market: collateral, borrow, lltv, risk | No |
| `approve_moolah_proxy` | Approve TRC20 for the V2 core before supply-collateral / repay | **Yes** |
| `moolah_supply_collateral` | Supply collateral into a market to enable borrowing | **Yes** |
| `moolah_withdraw_collateral` | Withdraw collateral (or `max`, only when no active borrow) | **Yes** |
| `moolah_borrow` | Borrow loan asset (optionally supply collateral in one call) | **Yes** |
| `moolah_repay` | Repay a market loan (or `max` for full shares-based settlement) | **Yes** |

#### JustLend V2 — Liquidation

| Tool | Description | Write? |
|------|-------------|--------|
| `get_moolah_pending_liquidations` | Positions eligible/approaching liquidation (`riskLevel > 1.0`) | No |
| `get_moolah_liquidation_quote` | Estimate loan-token cost to liquidate a position | No |
| `get_moolah_liquidation_records` | Historical V2 liquidation events | No |
| `approve_liquidator_token` | Approve loan token for the public liquidator contract | **Yes** |
| `moolah_liquidate` | Liquidate an undercollateralized V2 position | **Yes** |

#### JustLend V2 — Dashboard, History & Mining

| Tool | Description | Write? |
|------|-------------|--------|
| `get_moolah_dashboard` | V2 overview: top vaults + markets (+ optional user position) | No |
| `get_moolah_history` | User V2 position history (net worth/supply/borrow) + recent txs | No |
| `get_moolah_records` | Paginated V2 transaction history | No |
| `get_moolah_vault_history` | Vault APY / TVL / mining time series | No |
| `get_moolah_market_history` | Market APY / utilization / totals time series | No |
| `estimate_moolah_energy` | Estimate energy/bandwidth/TRX for a V2 write op | No |
| `get_moolah_vault_mining_apy` | Mining APY (USDD/TRX split) for a single vault | No |
| `get_moolah_mining_resolver` | Map every mining-active vault to its USDD/TRX APY split | No |
| `get_moolah_mining_accruing` | User's accruing & settling mining rewards across vaults | No |
| `get_moolah_pending_mining_periods` | User's claimable, merkle-published mining rounds | No |
| `claim_moolah_mining_period` | Claim one V2 mining airdrop round via `multiClaim()` | **Yes** |

#### Historical Records (V1 + cross-cutting)

| Tool | Description | Write? |
|------|-------------|--------|
| `get_lending_records` | V1 supply/withdraw/borrow/repay/collateral history | No |
| `get_strx_records` | sTRX stake/unstake/withdraw/transfer history | No |
| `get_vote_records` | Governance voting history (deposits + votes cast) | No |
| `get_energy_rental_records` | Energy-rental history (rent/extend/end/recycle) | No |
| `get_liquidation_records` | V1 liquidation history (as liquidator and as liquidated) | No |
| `get_claimable_rewards` | Scan V1 merkle distributors for a user's unclaimed rewards | No |
| `claim_v1_mining_period` | Claim one V1 mining airdrop round via `multiClaim()` | **Yes** |

### Prompts (AI-Guided Workflows)

The server exposes **14 MCP prompts**. Required arguments are marked **bold**; the rest are optional. Every prompt accepts an optional `network` (`mainnet` default, or `nile`).

| Prompt | Arguments | Description |
|--------|-----------|-------------|
| `getting_started` | _(none)_ | First-time onboarding: wallet setup, connection, feature tour |
| `supply_assets` | **`market`**, **`amount`**, `network` | Step-by-step supply with balance checks and approval |
| `borrow_assets` | **`market`**, **`amount`**, `network` | Safe borrowing with risk assessment and health factor checks |
| `repay_borrow` | **`market`**, **`amount`** (or `'max'`), `network` | Guided repayment with verification |
| `analyze_portfolio` | `address`, `network` | Comprehensive portfolio analysis with risk scoring |
| `compare_markets` | **`action`** (`supply` \| `borrow`), `network` | Find best supply/borrow opportunities |
| `rent_energy` | **`receiverAddress`**, **`energyAmount`**, **`durationDays`**, `network` | Guided energy rental with price estimation and balance checks |
| `stake_trx` | **`amount`**, `network` | Guided TRX staking to sTRX with APY info and verification |
| `query_proposals` | `network` | Browse and query governance proposals, check voting requirements |
| `cast_vote` | **`proposalId`**, **`support`** (`for` \| `against`), **`amount`** (WJST), `network` | Guided governance voting with vote verification |
| `moolah_supply` | `vaultSymbol`, `amount`, `network` | Deposit into a V2 ERC4626 vault (compares vaults if `vaultSymbol` omitted) |
| `moolah_borrow` | `marketId`, `collateralAmount`, `borrowAmount`, `network` | Supply collateral and/or borrow in a V2 market (browses markets if `marketId` omitted) |
| `moolah_liquidate` | `network` | Find and execute a V2 liquidation opportunity |
| `moolah_portfolio` | `address`, `network` | Analyze a user's full V2 position across vaults and markets |

> All prompt arguments are strings (the `enum` ones accept only the listed values). Prompts return a templated message that drives the agent through the workflow using the read/write tools above — they do **not** sign transactions themselves.

### Resources

The server registers one MCP **resource** for static protocol context an agent can read once and cache:

| URI | MIME type | Contents |
|-----|-----------|----------|
| `justlend://protocol-info` | `application/json` | Protocol summary (name, description, website, docs) **plus the live market list** — each entry with jToken symbol, jToken address, and underlying token (or `"native TRX"`). Generated from `chains.ts`, so addresses stay in sync with the deployed contracts. |

Use the resource for a one-shot "what is JustLend / which markets exist / what are the addresses" lookup; use the tools for live balances, rates, and positions.

### Machine-Readable ABIs

For programmatic contract calls without re-fetching from Tronscan, the MCP server bundles all JustLend contract ABIs in TypeScript form:

- **Source**: [`src/core/abis.ts`](https://github.com/justlend/mcp-server-justlend/blob/main/src/core/abis.ts) (jToken, Comptroller, Oracle, TRC20)
- **Chain configs (Mainnet / Nile testnet)**: [`src/core/chains.ts`](https://github.com/justlend/mcp-server-justlend/blob/main/src/core/chains.ts)

## Error contract

Every tool declares a common success `outputSchema`. Schema-aware clients should consume `structuredContent` and pin schema major `1`; older clients may continue reading the first text content item:

```json
{
  "schemaVersion": "1.0.0",
  "tool": "get_supported_markets",
  "result": {}
}
```

Every tool returns errors as structured JSON with `isError: true`, so an agent can branch without parsing prose:

```json
{ "error": "<sanitized message>", "errorCode": "<code>", "retryable": true, "hint": "<how to fix>" }
```

`errorCode`, `retryable`, and `hint` are present when the error is recognized; unrecognized errors return just `error`. Recognized codes:

| errorCode | retryable | Meaning / agent action |
|-----------|:---------:|------------------------|
| `transient` | ✅ true | Network/RPC timeout, `SERVER_BUSY`, 429/5xx — retry read-only calls after a short backoff; **never** blindly re-broadcast a write (re-query state first). |
| `insufficient_allowance` | ❌ false | Approve the spender first (`approve_underlying` / `approve_for_votes` / `approve_moolah_*`), then retry. |
| `insufficient_balance` | ❌ false | Lower the amount or fund the wallet; verify with `get_trx_balance` / `get_token_balance`. |
| `wallet_not_configured` | ❌ false | Run `npx agent-wallet start` (or import/generate via CLI), set `AGENT_WALLET_PASSWORD`, select `agent` mode, and activate the wallet. |
| `execution_reverted` | ❌ false | Contract precondition failed (allowance / health / paused market) — simulate before broadcasting. |
| `market_not_found` | ❌ false | Verify the market symbol/address against `get_supported_markets`. |
| `invalid_address` | ❌ false | Use a Base58 TRON address (`T…`, 34 chars). |

Only `transient` is safe to auto-retry; every other code requires a corrective action first.

## Security Considerations

- **Encrypted agent-wallet**: Private keys are encrypted at rest in `~/.agent-wallet/` with file permissions `0600`/`0700` — never stored in environment variables or config files
- **Browser bridge fail-closed**: The legacy unauthenticated loopback bridge is disabled; do not expose it until request-level authentication is available
- **No key in parameters**: Signing functions use agent-wallet internally; private keys are never passed as function parameters or exposed via MCP tools
- **Import via CLI**: Use `npx agent-wallet import` from a terminal — private key import is not exposed as an MCP tool to avoid key exposure in AI conversation logs
- **Explicit approvals**: TRC20/JST approval tools require an exact amount, while `max` remains available only when the user explicitly opts in
- **Pre-flight checks**: Supply/repay validate allowance first, lending tools report energy/bandwidth sufficiency warnings, and reverted simulations are not broadcast
- **Typed broadcasts**: Transaction broadcasts are parsed with typed responses so failed or rejected broadcasts surface as errors instead of ambiguous transaction IDs
- **Write operations** are clearly marked with `destructiveHint: true` in MCP annotations
- **Health factor checks** in prompts prevent dangerous borrowing
- Always **test on Nile testnet** before mainnet operations
- Be cautious with **unlimited approvals** (`approve_underlying` with `max`)

## Example Conversations

**"What are the best supply rates on JustLend right now?"**
→ AI calls `get_all_markets`, sorts by supplyAPY, presents ranking

**"I want to supply 10,000 USDT to earn interest"**
→ AI uses `supply_assets` prompt: checks balance → approves USDT → supplies → verifies

**"Am I at risk of liquidation?"**
→ AI calls `get_account_summary`, analyzes health factor, warns if < 1.5

**"Borrow 500 USDT against my TRX collateral"**
→ AI uses `borrow_assets` prompt: checks collateral → calculates new health factor → executes if safe

**"What is the TRX balance of address TXxx...?"**
→ AI calls the general-purpose TRX balance tool, returns balance in both TRX and Sun

**"Freeze 100 TRX for ENERGY"**
→ AI calls staking service to freeze via Stake 2.0, returns transaction hash

**"Show me the latest governance proposals"**
→ AI calls `get_proposal_list`, displays proposals sorted by ID with status and vote counts

**"I want to vote for proposal #425 with 1000 JST"**
→ AI checks `get_vote_info` → if no votes, suggests `approve_jst_for_voting` + `deposit_jst_for_votes` → then `cast_vote`

**"Withdraw my votes from completed proposals"**
→ AI calls `get_user_vote_status` to find withdrawable proposals → calls `withdraw_votes_from_proposal` for each

**"How much does it cost to rent 300,000 energy for 7 days?"**
→ AI calls `calculate_energy_rental_price` with energyAmount=300000, durationHours=168, returns cost breakdown

**"Rent 500,000 energy to address TXxx... for 14 days"**
→ AI uses `rent_energy` prompt: checks balance → checks rental status → calculates price → rents energy → verifies

**"Cancel my energy rental to TXxx..."**
→ AI calls `get_energy_rent_info` to verify active rental → calls `return_energy_rental` → confirms refund

**"Buy energy directly for these receiver addresses"**
→ AI calls `get_energy_purchase_config` → obtains `quote_energy_purchase` → shows payer, receivers, duration, and exact TRX amount → calls `buy_energy_direct` only after explicit confirmation → verifies token-bearing results with `get_energy_purchase_order`; tokenless/ambiguous results route through public history and the no-argument, read-only `get_energy_payment_risk` check before any explicitly confirmed recovery attempt

**"Stake 1000 TRX to earn sTRX rewards"**
→ AI uses `stake_trx` prompt: checks balance → checks exchange rate & APY → stakes TRX → verifies sTRX received

**"Do I have any sTRX rewards to claim?"**
→ AI calls `get_strx_account` to check claimable rewards → calls `claim_strx_rewards` if available

**"Can I withdraw my unstaked TRX?"**
→ AI calls `check_strx_withdrawal_eligibility` to check unbonding status and completed withdrawal rounds

**"Connect my TronLink wallet"**
→ AI explains that the legacy browser bridge is disabled, then guides the user to configure encrypted agent-wallet rather than bypassing the safety control

**"How much energy will supplying 100 USDT cost?"**
→ AI calls `estimate_lending_energy` with operation=supply, market=jUSDT, amount=100, returns energy/bandwidth/TRX breakdown
