---
title: AI Support
description: Entry point for AI agents and LLM tooling on JustLend DAO — machine-readable docs (llms.txt, OpenAPI, contracts.json, ABIs), the MCP server, JustLend Skills, and the AI/RAG documentation set.
tags:
  - justlend
  - ai-support
  - mcp
  - skills
  - llms
  - ai-docs
---

# AI Support

This section collects everything an AI agent or LLM tool needs to integrate with JustLend DAO: machine-readable documentation endpoints, the MCP server, JustLend Skills, the official CLI and V2 utility library, and a compact AI/RAG documentation set.

## In this section

| Page | Use for |
|------|---------|
| [AI / LLMs](ai_llms.md) | Machine-readable entry points — [`llms.txt`](/llms.txt), [`llms-full.txt`](/llms-full.txt), OpenAPI YAML, `contracts.json`, JSON ABIs — and which to use when. |
| [MCP Server](mcp_server.md) | Install and run the JustLend MCP server (104 tools): account analysis, market queries, transaction pre-flight, and wallet-aware writes with HITL confirmation. |
| [JustLend Skills](justlend_skills.md) | Six workflow modules plus a bundled 9-tool read-only MCP server for agent frameworks. |
| [CLI and V2 SDK](cli_and_sdk.md) | Source installation, versioning, JSON/exit-code contract, dry-run workflow, TronWeb injection, and write-safety rules. |
| [AI Docs for Agents](../documents/aidocs/index.md) | Compact, RAG-oriented pages: source-of-truth routing, market/account/workflow guides, MCP safety policy, English/Chinese FAQs, and the full MCP tool catalog. |

## Machine-readable sources of truth

Prefer these over rendered HTML when integrating programmatically:

- [OpenAPI 3.1 spec](../developers/apis/justlend_apis.yaml) — public read-only HTTP API contract (base URL `https://openapi.just.network`).
- [`contracts.json`](../developers/contracts.json) + [`contracts.schema.json`](../developers/contracts.schema.json) — deployed addresses in Base58 / EVM hex / TRON hex, with `active`/`legacy` status.
- [JSON ABIs](../developers/abis/index.md) — interface definitions for contract calls and event decoding.
- MCP tools — for any wallet-aware action; side-effect annotations and HITL confirmation apply.

## Choosing between API, MCP, and contracts

For task-by-task routing (e.g. "what markets exist", "this address's health factor", "supply for me", "is this transaction safe"), follow the [Source of Truth](../documents/aidocs/source_of_truth.md) decision guide. As a rule of thumb:

- **Read-only HTTP integration** → OpenAPI spec / `/lend/*` endpoints.
- **Agent workflows and wallet actions** → MCP server tools.
- **Terminal / CI automation** → JustLend CLI with `--json` and exit-code checks.
- **Embedded browser or Node.js integration** → JustLend V2 Utils with an explicitly injected `TronWeb` instance.
- **Addresses and ABIs** → `contracts.json` + `/developers/abis/`.
- **Concepts and risk context** → the human documentation pages.
