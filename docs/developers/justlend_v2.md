---
title: JustLend V2
description: "JustLend V2 — isolated-market lending plus ERC4626 vaults on TRON: protocol model (markets, shares, vaults, liquidation), how it differs from V1, and deployed mainnet/nile contract addresses."
---

# JustLend V2

**JustLend V2** is an isolated-market lending protocol on TRON, paired with **ERC4626 vaults** for passive supply-side yield. It runs alongside — not instead of — [JustLend V1](contracts_overview.md): V1 remains the Compound-V2-style pooled `jToken` market, while V2 adds an isolated-market model.

!!! note "Naming"
    V2's on-chain contracts and MCP tools carry the `Moolah` / `moolah_*` identifiers (e.g. `MoolahProxy`, `get_moolah_vault`, `MOOLAH_CORE_ABI`). That is the technical name of the V2 system; this page refers to the product as **JustLend V2** and uses those identifiers only where they match the actual contract/tool/ABI surface.

!!! note "V1 vs V2 at a glance"
    | | **V1 (jToken market)** | **V2 (isolated)** |
    |---|---|---|
    | Model | Compound V2 — one shared pool per asset | Isolated markets (à la Morpho Blue) |
    | Risk | Cross-collateral within the Comptroller | Contained per market (one collateral, one loan asset) |
    | Supply side | Mint `jTokens` | Deposit into an **ERC4626 vault** (or supply directly into a market) |
    | Identifier | `jToken` address | `marketId` (bytes32) |
    | Liquidation | Comptroller close-factor / incentive | Public liquidator at the market's **LLTV** |

## Protocol model

### Markets (isolated)

A V2 market is fully described by an immutable **`MarketParams`** tuple and addressed by its **`marketId`** (a bytes32 hash of those params):

| Field | Meaning |
|-------|---------|
| `loanToken` | the asset that is borrowed / supplied for yield |
| `collateralToken` | the asset posted as collateral |
| `oracle` | price feed used to value collateral vs loan |
| `irm` | interest-rate model |
| `lltv` | **liquidation loan-to-value**, scaled by `1e18` (e.g. `750000000000000000` = 75%) |

Because every market is a self-contained `(loan, collateral, oracle, irm, lltv)` tuple, risk is **isolated**: a bad asset in one market cannot drain another. Interest accrues into a **shares** accounting model — `supplyShares` and `borrowShares` whose value grows as interest is paid, rather than per-block index rebasing.

A position's **risk** is reported as a `0–1+` ratio against `lltv` (the MCP server surfaces this as `risk` / `riskLevel`): `> 1.0` means the position is liquidatable.

### Vaults (ERC4626)

V2 **vaults** are ERC4626 tokenized vaults that aggregate supply-side liquidity and allocate it across markets. Users `deposit` an underlying asset and receive vault **shares**; `withdraw` (by asset amount) or `redeem` (by share amount) to exit. Vaults also accrue **mining** rewards (USDD / TRX splits).

### Liquidation

When a borrower's risk reaches the market `lltv`, anyone may liquidate through the **PublicLiquidatorProxy**: repay part of the debt (in the loan token) and seize the corresponding collateral at a discount. See `get_moolah_pending_liquidations` / `get_moolah_liquidation_quote` / `moolah_liquidate` in the [MCP server tool catalog](../ai_support/mcp_server.md#tools-104-total).

### Native TRX

Native TRX is not an ERC20, so TRX operations route through the **TrxProviderProxy**, which wraps/unwraps **WTRX** transparently. Callers pass TRX amounts as `callValue`; TRC20 markets/vaults use the **MoolahProxy** directly after an `approve`.

## Deployed contracts

Addresses are the source-of-truth deployment config tracked in the MCP server's [`src/core/chains.ts`](https://github.com/justlend/mcp-server-justlend/blob/main/src/core/chains.ts). Always verify against on-chain data before integrating.

### Mainnet

| Contract | Address |
|----------|---------|
| MoolahProxy (core lending) | `TDH4dhmVQQNc1ZNudJwWzBcs2h6ahhWrpp` |
| TrxProviderProxy (native TRX) | `TMDENHFSiRzmJNSEBAFmrDbLkQ672iPN8H` |
| PublicLiquidatorProxy | `TGDuQaHtvadVL5z9PMM874CaehQnwf3qJi` |
| WTRX (wrapped TRX) | `TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR` |
| ResilientOracle | `TUDXEUA6hNiWPm54cMifoxCZU28zRu6bPc` |
| IRM (interest-rate model) | `TSsuwbvUKAVgRmSghXT7i38PgHWpW12wQ1` |

**Vaults (mainnet)**

| Vault | Underlying | Vault address |
|-------|-----------|---------------|
| TRX | native TRX | `THpxp8RpCUGk55dV7oL1LfxDeP9QvouxmM` |
| USDT | `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` | `TXejU9jmd1ooQyY3Zmpo15yN7MjSFYUESg` |
| USDD | `TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz` | `TA3q7XjdBQWb4qFxaPULUsnjvVZGgC9Brz` |

### Nile testnet

| Contract | Address |
|----------|---------|
| MoolahProxy | `TFgrgsd8c37ByaZx1YxpBzazJS8bHsoP5c` |
| TrxProviderProxy | `TMRZwenUVHPvnxhwDDQLY4SEmmwXvtKRjz` |
| PublicLiquidatorProxy | `TLvPrXHVQCA54gLQjLfoNi5XQ6WqhXCEps` |
| WTRX | `TYsbWxNnyTgsZaTFaue9hqpxkU3Fkco94a` |
| ResilientOracle | `TFYLvDFSEW6dKSnWb3mt76hkHAgxPktrnG` |
| IRM | `TQYeFiTVNfJ6jfqjyfL2s93VLG1huaMEzC` |

!!! warning "Nile vaults not deployed"
    The V2 **core** contracts are live on Nile, but the **vaults are not yet deployed** there. Vault-level calls on Nile will fail at the chain layer. The V2 REST backend (dashboards/history) is **mainnet-only**.

## Using V2 via the MCP server

The [JustLend MCP Server](../ai_support/mcp_server.md) (current: v1.1.3) exposes the full V2 surface under `moolah_*` / `get_moolah_*` tools — vaults, markets, liquidation, dashboard/history, and mining — plus four guided prompts (`moolah_supply`, `moolah_borrow`, `moolah_liquidate`, `moolah_portfolio`). See the [V2 tool groups](../ai_support/mcp_server.md#tools-104-total) and the [MCP Tool Catalog](../documents/aidocs/mcp_tools.md).

Contract ABIs (`MOOLAH_CORE_ABI`, `TRX_PROVIDER_ABI`, `MOOLAH_VAULT_ABI`, `PUBLIC_LIQUIDATOR_ABI`) are bundled in the MCP repo's [`src/core/abis.ts`](https://github.com/justlend/mcp-server-justlend/blob/main/src/core/abis.ts). For the full on-chain ABIs and contract data structures (`Position`, `MarketParams`, `MarketConfig`, `MarketAllocation`, …), see the [SBM V2 contract reference](supply_and_borrow_market/sbmV2.md).

## REST API

The public [`openapi.just.network`](apis.md) gateway currently serves both V1 and V2 protocol data. You can access data directly via the REST endpoints, as well as through the MCP server tools or by reading the contracts on-chain.
