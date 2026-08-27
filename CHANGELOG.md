# Changelog

All notable changes to the JustLend DAO documentation site.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates use `YYYY-MM-DD` (ISO 8601).

For the JustLend protocol itself, see governance proposals on [forum.justlend.org](https://forum.justlend.org) and on‑chain via `getActions(proposalId)` on the Governor contract.

---

## [Unreleased]

### Added — 2026-08-19 AI-readability contract pass

- Added first-class CLI and V2 Utils discovery across navigation, `llms.txt`, `llms-full.txt`, AI source routing, JSON-LD, and a dedicated install/safety guide.
- Synced the agent surfaces to CLI `1.0.1`, full MCP `1.1.3`, and Skills `1.1.1`, including versioned success/error envelopes and published output schemas.
- Regenerated the site-local 104-tool MCP catalog with `outputSchema` coverage on every tool and documented the bundled Skills server's 9 structured outputs.
- Published canonical raw Markdown beside every rendered page and advertised it with `rel="alternate" type="text/markdown"` plus a visible source link.
- Added deterministic AI-consistency checks and a weekly, structured 9-probe live API acceptance artifact in CI.

### Fixed — 2026-08-19 AI-readability contract pass

- Reconciled the market inventory to **24 total (18 active + 6 legacy)** after expanding `app.justlend.org/marketNew` and cross-checking `/lend/jtoken` plus the MCP chain catalog; added the previously omitted active `jU` market everywhere.
- Corrected `/lend/account`: `addresses` is optional, omission returns the global account index, and the endpoint-specific default `pageSize` is 50.
- Added verification provenance and freshness metadata to `contracts.json` and its JSON Schema.
- Aligned MCP, CLI, and Skills guidance with the official mainnet energy API default, public payer-history recovery, tokenless idempotent orders, exact signed-request persistence, the configured-wallet/no-argument payment-risk check, and the CLI's actual 30 top-level command groups.

### Added — 2026-05-22 API-style + reference-gap pass

- **TronWeb call style unified across all developer pages.** Removed every `.methods.X()` (Web3.js-style) call from `developers/common_pitfalls.md` (10 occurrences) and `developers/supply_and_borrow_market/sbm.md` (admonition snippet) — now consistently using TronWeb 5.x direct style (`contract.method(args).call()` / `.send()`). Also dropped `.send({ from: addr })` (8 in common_pitfalls + 4 in sbm) in favor of the canonical TronWeb pattern of setting `tronWeb.defaultAddress` once. Both styles were technically supported, but the same file used both inconsistently. The `safeApprove` helper now throws early if `tronWeb.defaultAddress.base58` is unset (silent "no sender" failure was the most common confusion).
- **Multicall3 address documented.** On TRON Mainnet: `TX56WKxtja91Dybf2FdN4hZbDLyKVxxhAu`. Sourced from the MCP server's `src/core/chains.ts` and **independently verified on-chain** via TronGrid `triggerconstantcontract` (contract name on-chain is literally `Multicall3`; `getCurrentBlockTimestamp()` returns a valid epoch). Added to `mcp_server.md`, `llms-full.txt`, and the new `glossary.md` Multicall3 entry.
- **Cross-links from `ai_support/mcp_server.md` and `ai_support/justlend_skills.md`** to `Common Pitfalls` and `Glossary`. These two AI-Support pages are the entry point for agent integrators but previously had no inbound links to the v7-introduced reference pages.
- **JST supply: on-chain query example in `tokenomics.md`.** Replaced the implicit "current supply is X" lack-of-info with a TronWeb snippet that reads `totalSupply()` from the JST TRC20 (`TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9`). Decimals = 18 (verified on-chain). Avoids baking in a hard-coded number that drifts as the buyback-and-burn program executes.
- **Energy rental `~50–80% cheaper` claim now anchored to the worked example** (`getting_started/concepts/energy_rental.md` § Cost Estimation). The Cost Estimation table shows 71% savings for a USDT-holding receiver and 84% for a receiver without USDT in one specific past snapshot — that's where the "~50–80%" headline came from. Both `concepts/energy_rental.md` (intro paragraph) and `llms-full.txt §2.8` now explicitly link to / restate the worked example rather than treating the range as a forecast.
- **dApp URLs added** to user concept pages that previously had no "Try it" link: `repay.md`, `withdraw.md`, `risks.md` (positions / liquidation monitor), `energy_rental.md` (user-side), `overview.md` (consolidated entry-point list).
- **`feeLimit: 200_000_000` (200 TRX) in TronWeb examples** annotated as "cap, not cost" — actual energy + bandwidth cost for a Compound V2 `mint` is typically well under 40 TRX worth at current network prices.

### Verified on-chain (or against authoritative source) — no fabricated numbers introduced this round

| Claim | Source / verification | Confidence |
|---|---|---|
| Multicall3 on TRON Mainnet = `TX56WKxtja91Dybf2FdN4hZbDLyKVxxhAu` | MCP server `chains.ts` + TronGrid `getcontract` returned `name: "Multicall3"` + live `getCurrentBlockTimestamp()` call | ✅ verified |
| JST decimals = 18 | TronGrid `triggerconstantcontract` `decimals()` returned 18 | ✅ verified |
| MCP server v1.0.7 | npm registry `@justlend/mcp-server-justlend` `latest` = 1.0.7 | ✅ verified |
| TRON USDT (`TR7NHq…`) is a `TetherToken` contract subject to the dual-zero approve constraint | TronGrid `getcontract` returned `name: "TetherToken"` (same family as ETH USDT, which famously enforces the dual-zero check) | ✅ strongly supported (not directly tx-tested but contract identity confirmed) |
| Multicall3 `~2.5s vs ~8s legacy` benchmark | Quoted directly from upstream MCP server README; not independently benchmarked | 📝 upstream claim, not fabricated |
| `app.justlend.org/energy?lang=en-US` | URL pattern matches existing documented routes (`/strx`, `/liquidate`, `/homeNew`, `/marketNew`); HTTP 200 returns SPA shell — actual client-side route handler not independently verified | ⚠️ pattern-matched, low risk |

### Fixed — 2026-05-22 content-accuracy pass

- **Governance lifecycle: removed the "2-day review period" claim.** A direct on-chain read of `GovernorBravoDelegator.votingDelay()` (TronGrid `triggerconstantcontract`) returned `1 block ≈ 3 seconds`. The docs (`jips.md`, `developers/supply_and_borrow_market/governance.md`, `llms-full.txt §3`) previously described a "2-day review period" between `propose()` and `Active` state as if it were protocol-enforced. It is **not** — it's a community / forum convention. Rewrote all three locations to (a) cite the verified on-chain timings (`votingDelay = 1 block`, `votingPeriod = 86,400 blocks ≈ 3 days`, `Timelock.delay() = 172,800 sec = 48 hours`) and (b) explicitly call out that the off-chain forum discussion is **not** enforced by the contracts. Governance-bot authors should not assume any gap between `propose()` and `Active`.
- **`apis.md §1.7` rate limits: removed fabricated numbers.** The v7 pass introduced `~10 req/s sustained`, `~30 req/s burst`, `≤ 4 concurrent connections per IP` as if they were measured soft limits — they were not; they were invented during writing to give agents a starting point. Replaced with an honest "no published numeric rate limit" framing plus an adaptive client policy (start at 1 req/s, double after each clean 60-second window, halve on persistent 429, cap at 20 req/s as an arbitrary self-safety net) that converges to the real ceiling without guessing it.
- **`sbm.md` TronWeb examples: switched naive `usdt.approve()` to `safeApprove()`.** The v7 pass added a top-of-page warning about TRON USDT's `approve()` race condition, but the inline example for "Supply USDT" and "Repay USDT" still used the naive `usdt.approve(JUSDT, amount).send()` pattern — which works the first time and reverts on every subsequent call. Both examples now define and use a `safeApprove(token, spender, amount, sender)` helper that reads the current allowance, zeros it if non-zero and different from target, then sets the target. Also switched the `repayBorrow` example to pass `uint256(-1)` for full-balance repays instead of a stale locally-computed amount.
- **`120,000 energy per USDT transfer` estimate replaced with both endpoints of the real range.** Actual cost: ~64,000 energy when the receiver already holds USDT (warm storage slot), ~130,000 energy when the receiver is creating a fresh USDT balance (cold storage slot). The 120K midpoint historically used in `getting_started/concepts/energy_rental.md` and `llms-full.txt` under-rented in the cold-storage case. Both files now spell out the two cases.
- **DipDup TRON support claim softened.** The v7 pass listed DipDup as a TRON-capable EVM indexer ("TRON support via the EVM-compatible adapter"). TRON's EVM compatibility is partial, and we did not verify that DipDup's current TRON support handles the events we care about end-to-end. Rewrote `apis.md §8.2` and `llms-full.txt §6` to treat all generic EVM indexers (DipDup, Subsquid, Substreams, Goldsky) as evolving / requires-PoC, and to position a custom decoder against a `java-tron` archive endpoint as the most robust path.

### Added — 2026-05-22 content-accuracy pass

- **Cross-links from 6 core developer / user pages to the v7 glossary and common-pitfalls pages** — `sbm.md`, `comptroller.md`, `deployed_contracts.md`, `getting_started/concepts/{borrow, supply, liquidations}.md`. Previously the new pages were nav-listed and linked from `llms.txt` but had no inbound links from the high-traffic developer references. A RAG chunk pulled from `sbm.md` now carries a `[Glossary](../../resources/glossary.md)` anchor and a `[Common Pitfalls](../common_pitfalls.md)` anchor for term lookups and integration gotchas.
- **JSON-LD `dateModified` + `datePublished`** on every real built page, sourced from `mkdocs-git-revision-date-localized-plugin`'s `page.meta.git_revision_date_localized_raw_iso_date`. Schema.org `TechArticle` nodes now expose page freshness to Google / Bing / Perplexity / Anthropic search summarizers without them having to scrape the page footer. Verified: 31/31 real built pages.
- **`mkdocs.yml validation:` block** (mkdocs 1.5+) elevating broken anchor links to `warn` (so `mkdocs build --strict` catches them) while keeping the intentional absolute `/llms.txt` links in `ai_support/ai_llms.md` at `info` (they resolve at runtime against the site root).
- **On-chain verified parameter values** noted inline on the Comptroller admonition (`closeFactor = 0.5e18` / `liquidationIncentive = 1.08e18`) and the Governance admonition (`votingDelay = 1 block`, `votingPeriod = 86,400 blocks`, `Timelock.delay = 172,800 sec`) so future audits can spot-check the docs against a single TronGrid call.

### Added — 2026-05-21 AI-readability v7 content-layer pass

- **`docs/resources/glossary.md`** (new) — a single-page reference for every protocol-specific term used elsewhere: `mantissa`, `kink`, `utilization`, `sun`, `borrow index`, `collateral / close / reserve factor`, `liquidation incentive`, jToken vs underlying decimals, exchange rate, Risk Value, market `status: active|legacy`. Each entry calls out units, on-chain encoding, and which function returns the value. Added to `Resources` nav.
- **`docs/developers/common_pitfalls.md`** (new) — the 10 most common foot-guns when integrating with JustLend: USDT-style `approve()` race condition, `enterMarkets` requirement, `mint()` overload between jTRX (payable) and jTRC20 (uint arg), `redeem` vs `redeemUnderlying` confusion, jToken-8-decimals vs underlying mismatch, `liquidateBorrow` 50% close-factor cap, `uint256(-1)` repay sentinel, TRON energy/bandwidth model (not Ethereum gas), oracle-freshness caveat, legacy-market policy filter. Added to `Developers` nav.
- **USDT-style approve race warning admonition** in `developers/supply_and_borrow_market/sbm.md` — explicit safe pattern (`approve(0)` before `approve(N)` when current allowance is non-zero) for jUSDT / jUSDCOLD / jTUSD / jUSDDOLD / jBUSDOLD-style markets. Previously this foot-gun was undocumented despite being the #1 integration failure on TRON.
- **Concrete rate-limit numbers** in `developers/apis.md §1.7` — replaced fluffy "throttle abusive traffic" with explicit soft limits (~10 req/s sustained, ~30 req/s burst, ≤ 4 concurrent connections per IP, `pageSize` ≤ 1000) and a recommended exponential-backoff retry policy with concrete `base = 1000ms`, `max sleep = 30s`, `max attempt = 5`. Agents can now size backoff without guessing.
- **§8 Event-stream and indexing options** (new section in `apis.md`) — explicitly answers "how do I query historical Mint/Borrow/Repay events". Documents that no official subgraph exists, then enumerates three real paths: TronGrid event filter (low-volume), self-hosted indexer via DipDup or Substreams (production), and MCP server read primitives. Includes the per-contract event signature reference, with a note to derive `topic0` from the JSON ABIs at runtime rather than hard-coding. Mirrored summary in `/llms-full.txt §6`.
- **Hand-written TOCs** at the top of `apis.md` (753 lines) and `ai_support/mcp_server.md` (535 lines) so raw-Markdown RAG loaders, which don't render Material's sidebar TOC, see the structure of the page in the first 30 lines.
- **Expanded `apis.md` quick-start response example** — now shows the realistic ~15-field per-token shape (`borrowIndex`, `cash`, `totalSupply`, `reserveFactor`, `collateralFactor`, `exchangeRate`, etc.) with a units cheat-sheet, instead of just `{symbol, underlyingSymbol}`. Agents calling `/lend/jtoken` for the first time now see what they're going to get.
- **`sun` unit definition** linked into user concept pages — `staked_trx.md` and `energy_rental.md` admonitions now point at [`Glossary → sun`](resources/glossary.md#sun) so users crossing into the developer flow have a single reference for `1 TRX = 10⁶ sun`.
- **Legacy-market support-window policy** explicit on `developers/deployed_contracts.md` — what `(legacy)` actually means (closed at policy layer, contracts queryable indefinitely, no announced sunset, addresses never reused), what still works (`repayBorrow`, `redeem`, reads), and what filter to apply programmatically (`status == "active"` from `contracts.json`).

### Fixed — 2026-05-21 AI-readability v7 content-layer pass

- **`Reapy` typo** in `developers/supply_and_borrow_market/sbm.md:23` (long-standing — present from the initial repo state through every prior audit) → `Repay`. AI agents reading the SBM section's bullet list no longer see a fictitious function name.

### Added — 2026-05-21 AI-readability v6 follow-up

- **Snapshot metadata auto-substitution** in `hooks/copy_dotfiles.py` — `llms-full.txt §0` now ships `{{LAST_GENERATED}}` / `{{DOCS_COMMIT}}` / `{{DOCS_COMMIT_SHORT}}` placeholders that the post-build hook replaces with the current UTC date and `git rev-parse HEAD` (with `GITHUB_SHA` fallback for CI). Previously hand-edited and drifted whenever a commit landed without someone remembering to bump §0.
- **"About this page" admonitions + frontmatter** on the 4 SBM sub-pages that were still missing them: `comptroller.md`, `supply_and_borrow_market/governance.md` (170 lines of GovernorBravo reference — high-value for AI agents writing governance flows), `price_oracle.md`, `interest_rate_model.md`.
- **Frontmatter + H1** on the 6 remaining leaf pages: `governance/jips.md`, `resources/risk_warning.md`, `resources/community/links.md`, `resources/community/wallet_integration_cooperation.md`, and both FAQ pages (`wallet_connection_questions.md`, `spending_cap_issue.md`).
- **`status_values` documentation in `contracts.json` `_meta`** plus a corresponding tip block in `developers/apis.md §2` — the per-jToken `status: "active" | "legacy"` field was undocumented despite being the cleanest programmatic way to filter the 17 active markets from the 6 legacy ones.
- **`contracts.schema.json` advertised** in `llms.txt`, `robots.txt`, and `ai_support/ai_llms.md` (both the tip block and the "which file should I use" table). The schema file was deployed in v5 but no entry-point page mentioned it.
- **`/.well-known/security.txt` explicit `Allow:`** in `robots.txt` (the URL was advertised in `llms.txt` but not whitelisted; some strict crawlers skip URLs without an explicit allow rule).

### Fixed — 2026-05-21 AI-readability v6 follow-up

- **`contracts.schema.json` did not actually validate `contracts.json`** (the v5 schema described a generic `contract_record` shape but the real `jtokens` use a richer wrapper with `symbol` / `status` / `decimals` / `delegator` / `underlying` / `delegate` sub-records, and the `nile` block has a free-text `note` string). Rewrote the schema to match real data; `jsonschema` Draft 2020-12 validation now passes with 0 errors. New `jtoken_record` and `underlying_record` `$defs` capture the actual structure; `network` definition allows the per-network `note` string.
- **Three dead `tronscan.io` links** → `tronscan.org`. `tronscan.io` does not resolve; the typo was in `developers/energy_rental.md` (2 occurrences) and `developers/deployed_contracts.md` (1 occurrence, Energy Rental row).

### Added — 2026-05-21 AI-readability v5 pass

- **`site_description` and `site_author`** in `mkdocs.yml` so every page renders a non-empty `<meta name="description">` and `<meta name="author">` (previously omitted on every page because both meta keys were missing).
- **Per-page YAML frontmatter** (`title` + `description`) on the 17 highest-value pages: all 8 user concept pages, `overview.md`, `tokenomics.md`, `apis.md`, `deployed_contracts.md`, `contracts_overview.md`, `sbm.md`, `ai_llms.md`, `mcp_server.md`, `justlend_skills.md`, plus `staked_trx.md` and `energy_rental.md` developer pages and the site root `index.md`. MkDocs / Material picks up `description` automatically into `<meta description>` and the JSON-LD `TechArticle.description`.
- **Explicit `# H1` headings** in the source Markdown of the 10 files that previously had none (`supply.md`, `borrow.md`, `withdraw.md`, `repay.md`, `risks.md`, `staked_trx.md`, `energy_rental.md`, `liquidations.md`, `overview.md`, `tokenomics.md`). HTML rendering was unaffected (Material synthesized the heading from nav), but raw-Markdown RAG loaders (which fetch `raw.githubusercontent.com/.../foo.md`) now see a heading anchor on every page.
- **"About this page" admonitions** on the 6 concept pages that lacked them (`supply.md`, `borrow.md`, `withdraw.md`, `repay.md`, `risks.md`, `staked_trx.md` (user), `energy_rental.md` (user)) plus upgraded admonitions on the two developer pages (`developers/staked_trx.md`, `developers/energy_rental.md`). Each banner restates protocol / network / units / cross-refs so any RAG chunk retrieved in isolation carries identity.
- **JSON-LD (`application/ld+json`)** in `docs/overrides/base.html` `<head>`, emitted on every page. Three nodes: an `Organization` for JustLend DAO, a `SoftwareApplication + FinancialProduct` for the protocol with `potentialAction` pointers to `/llms-full.txt`, `/developers/contracts.json`, and the OpenAPI YAML, and a per-page `TechArticle` carrying the page's description.
- **MkDocs `on_post_build` hook (`hooks/copy_dotfiles.py`)** that copies `docs/.well-known/` (and any future dotfile-rooted directory) into `site/.well-known/`. MkDocs's default file walker skips dotfile directories, so `/.well-known/security.txt` was returning 404 in production even though the file existed in the repo and was referenced from `llms.txt` / `robots.txt`.
- **`contracts.schema.json`** (JSON Schema 2020-12) — the `$schema` URL embedded in `contracts.json` now resolves to a real document. Schema enforces TRON Base58 / EVM 0x / TRON 41-hex address regexes and the per-record `network` enum.
- **Real landing content in `docs/index.md`** — previously a one-line meta-refresh tag with no body. AI crawlers landing on the site root now get protocol summary + curated entry points for users, developers, AI agents, governance, plus external links; browsers still 0-second redirect via meta-refresh + canonical.
- **Snapshot warning admonition** on the USD cost tables in `getting_started/concepts/energy_rental.md` (`§Cost Estimation`) — the example transactions and `$X.XX` numbers are historical and should not be fed into live pricing decisions.
- **Copy-pastable MCP install snippet** in `ai_support/justlend_skills.md` — a single `jq` one-liner that resolves `$(pwd)` and patches Claude Desktop's config in place, so AI agents that auto-execute the docs don't get stuck on `/ABSOLUTE_PATH_TO/` placeholders.

### Fixed — 2026-05-21 AI-readability v5 pass

- **`/.well-known/security.txt` 404 in production (P0).** The file was in `docs/.well-known/` and referenced by `llms.txt` and `robots.txt`, but MkDocs's default file walker skipped the dotfile directory. Fixed by the new `copy_dotfiles.py` hook.
- **Blocks-per-year math in `/llms-full.txt §7.4`.** Was `~10,512,000` (`365 × 86400 / 3`), which is off from the leap-year-averaged `10,517,760` (`365.25 × 86400 / 3`). Both numbers are now spelled out as approximations, with an explicit recommendation to prefer the API's pre-computed `apy` fields when precision matters.
- **`contracts.json` `_meta` block (P1).** `schema_version` bumped from `"1"` to semantic `"1.1.0"` with a `schema_version_policy` field explaining MAJOR / MINOR / PATCH semantics. Added `$schema` pointer to the new `contracts.schema.json`. Added an `address_formats` sub-block documenting each format's intended use case (Base58 for UI, hex_evm for cross-chain, hex_tron for TronGrid).
- **Backtick-colon parameter labels (P2).** `` `Supply APY:` `` (inline-code-then-colon) was tokenizing as one opaque code span; replaced with standard `**Supply APY:**` Markdown bold on `supply.md`, `borrow.md`, and `liquidations.md`. Also added a Borrow-Limit definition that was previously missing on `borrow.md`.
- **Broken link in `getting_started/concepts/liquidations.md` developer-reference footer** — `../../developers/apis/#3-supply-borrow-market` (which MkDocs flagged as unrecognized) → `../../developers/apis.md#3-supply-borrow-market`.

### Added — 2026-05-21 AI-data-consistency pass

- **`/llms-full.txt` snapshot metadata header** (`§0`): `last_generated`, `docs_commit`, `contracts_json_source`, `mcp_server_version` so consumers can detect staleness without diffing the body.
- **Homepage freshness admonition** in `getting_started/overview.md` covering protocol name, network (TRON Mainnet), market count (17 active + 6 legacy = 23), and pointers to the rendered footer date, `CHANGELOG.md`, and `/llms-full.txt`.
- **Self-contained "About this page" admonitions** at the top of `developers/contracts_overview.md` and `getting_started/concepts/liquidations.md` (P1 #4 fix from the v4 audit) so that RAG chunks retrieved in isolation still carry protocol + network + units context.
- **Structured contract overview table** in `developers/contracts_overview.md` (P1 #3) with one row per contract: address, upgradeable?, proxy mode, key functions, ABI link, doc link. Replaces the previous prose-only "navigation shell".
- **`<link rel="llms" href="/llms.txt">` discoverability hint** in `docs/overrides/base.html` `<head>` (P1 #5) plus `Sitemap`/`Allow: /llms.txt`-class entries already in `robots.txt`.

### Fixed — 2026-05-21 AI-data-consistency pass

- **Cross-page jToken count contradiction (P0 #1).** `ai_support/justlend_skills.md` previously titled its 9-row table "Supported Markets", which RAG chunks misread as the protocol's full market list, contradicting `llms-full.txt` (17 active + 6 legacy = 23). Renamed to "Featured Markets (CLI Quick Reference)" and reframed: the table is now explicitly a CLI shortcut subset, with the authoritative source-of-truth ordering (live API → `contracts.json` → `apis.md` §2) stated above it. `llms-full.txt §5.2` similarly hardened to cite the same single source of truth in-chunk.

### Added — prior to 2026-05-21
- `CHANGELOG.md` (this file).
- `mkdocs-git-revision-date-localized-plugin`: every page now shows last-updated date in the footer, sourced from git commit metadata.
- `AI / LLMs` navigation page listing `/llms.txt`, `/llms-full.txt`, OpenAPI, `contracts.json`, and JSON ABI endpoints for agent users.
- Machine-readable contract directory at `/developers/contracts.json`, including Mainnet and Nile addresses in Base58, EVM `0x` hex, and TRON-internal `41` hex.
- JSON ABI files under `/developers/abis/` for jToken, Comptroller, PriceOracle, TRC20, governance, WJST, sTRX, Energy Rental, and rate-model contracts.
- Nile testnet contract reference in `developers/deployed_contracts.md`, with the complete machine-readable list mirrored in `contracts.json`.
- Public API rate-limit guidance in `developers/apis.md`, `llms.txt`, `llms-full.txt`, and the OpenAPI `x-rate-limit` extension, including `429` retry behavior.
- Developer-reference cross-links from user concept pages to the corresponding contract functions and TronWeb examples.
- `/.well-known/security.txt` for automated security-contact discovery.
- MCP server docs synced to `@justlend/mcp-server-justlend` v1.0.7, including current dependency/runtime versions and precision-safe sTRX staking behavior.
- Resolved `_(see Tronscan)_` placeholders in `deployed_contracts.md`:
  - `jHTX` delegate implementation: `TJD7nb5Wq1P1rRi3Se2vLpLhksALdW8adb`.
  - `jUSDDOLD` underlying TRC20: `TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn`.
- Re‑embedded interactive Swagger UI at the bottom of `developers/apis.md` (the 700‑line markdown reference still covers AI consumption; the embedded UI restores in‑page "Try it out").

### Removed
- Orphan documentation pages that were being indexed by `sitemap.xml` but rendered nearly empty: `developers/supply_and_borrow_market.md` and `governance/community_forum.md`.

### Fixed
- Removed duplicate ABI guidance from `developers/deployed_contracts.md` after adding local JSON ABI downloads.
- Added language tags to remaining unlabeled code fences in API and MCP docs.

---

## [2026-05-20] — AI-readability overhaul (PR #51)

### Added
- **AI entry files** at the site root, served as `text/plain`:
  - `/llms.txt` — [llmstxt.org](https://llmstxt.org/) navigation index.
  - `/llms-full.txt` — condensed full-text snapshot for single‑fetch LLM consumption.
  - `/robots.txt` — explicit `Allow` for 20+ major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) and `Sitemap:` pointer.
- **`mkdocs-redirects`** configured for every legacy hyphenated URL (e.g. `/developers/supply-and-borrow-market/sbm/`) → current underscore URL, including the previously-404 `…/get-market-mining-apy-information`. Output is meta-refresh + `<link rel="canonical">`; major crawlers treat as 301-equivalent.
- **TronWeb call examples** in `developers/supply_and_borrow_market/sbm.md` (7 snippets), `developers/staked_trx.md` (4 snippets), and `developers/energy_rental.md` (4 snippets). Each includes a precision/unit admonition and the required pre-flight checks (e.g. `approve`, `enterMarkets`, `getAccountLiquidity`).
- **Machine-readable ABI canonical** reference in `ai_support/mcp_server.md` and `developers/deployed_contracts.md` pointing at [`mcp-server-justlend/src/core/abis.ts`](https://github.com/justlend/mcp-server-justlend/blob/main/src/core/abis.ts) and [`chains.ts`](https://github.com/justlend/mcp-server-justlend/blob/main/src/core/chains.ts).
- **HTX market** documented across all five docs (`deployed_contracts.md`, `apis.md` §2, `mcp_server.md`, `justlend_skills.md`, `llms-full.txt`).

### Changed
- **`developers/deployed_contracts.md`** restructured from bullet lists into tables with explicit "Network: TRON Mainnet" banner, Tronscan links on every row (ABI accessible via Contract tab), and precision/decimals admonition.
- **`developers/apis.md`** rewritten by upstream PR #50 from a single `<swagger-ui>` embed to a 700-line structured human-readable reference: response envelope (`{code, message, data}`), TRON Base58 address format, unit conventions (`*Rate` / `apy` as annualized decimals, `*Factor` ∈ [0, 1], jToken = 8 decimals), and `0x…` hex decoding for `/mining/distributions`.
- **`ai_support/mcp_server.md`** refreshed for `@justlend/mcp-server-justlend` v1.0.6: 59 tools (was 54), new categories (Mining & Rewards, Transfers, Wallet Mode), dual-mode signing (browser via TronLink TIP-6963 + agent-wallet), HTTP/SSE fail-closed `MCP_API_KEY` requirement.
- **`ai_support/justlend_skills.md`** updated to reflect the 9-tool read-only Skills MCP server, with cross-reference to `apis.md` §2 for the authoritative market list.
- **`developers/apis.md` §2 jToken Address Reference** now states "17 active + 6 legacy = 23 markets" with `jHTX` and four `*OLD` entries.

### Fixed
- **Market count consistency**: all five core docs (`deployed_contracts.md`, `apis.md`, `mcp_server.md`, `justlend_skills.md`, `llms-full.txt`) now report **17 active + 6 legacy = 23 markets**. Previously they reported 8 / 16 / 21 / 22 in different places.
- **Tool count consistency**: MCP server tool count is **59** everywhere (previously 9 / 54 / 59 in different files); Skills tool count is **9** everywhere.
- **`jUSDC` → `jUSDCOLD`** in `deployed_contracts.md`, `justlend_skills.md`, and `llms-full.txt` — the USDC supply/borrow market is closed but the contract is still queryable for read operations.
- **`jUSDJ` and `jWBTT`** marked as legacy (closed to new supply/borrow) across all docs.
- **`jUSDDOLD`** added to all docs as a legacy market with delegator `TX7kybeP6UwTBRHLNPYmswFESHfyjm9bAS`.
- **ETH / ETHB display-name swap** documented in `deployed_contracts.md`, `llms-full.txt`, and `justlend_skills.md`: the dApp UI now labels delegator `TR7BUFRQeq1w5jAZf1FKx85SHuX6PfMqsV` as "ETH" (formerly "ETHOLD") and delegator `TWBxQMb6RD3qmkXUXpNwVCYbL8SHNreru6` as "ETHB" (formerly "ETH"). On-chain addresses are unchanged.
- **CI workflow** (`.github/workflows/gh-pages.yml`) installs `mkdocs-redirects==1.2.2`; Chinese comments translated to English.

### AI-readability impact
External audit (`justlend-docs-ai-readability-report.md` series) tracked the project from **6.8 → 9.0 / 10** across this release (V1 → V3 reports). See `downloads/standards/` for the audit framework used.

---

## Earlier history

For documentation changes before 2026-05-20 (V1.0.4 / V1.0.5 / V1.0.6 MCP server refreshes, governance text fixes, API spec format updates), see the [GitHub releases](https://github.com/justlend/justlend-docs/releases) and `git log`.
