#!/usr/bin/env node
/** Deterministic cross-surface checks for agent-readable JustLend docs. */

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = new URL('../', import.meta.url);
const read = async (path) => readFile(new URL(path, ROOT), 'utf8');
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function filesUnder(path) {
  const rootPath = new URL(path, ROOT);
  const output = [];
  async function walk(url) {
    for (const entry of await readdir(url, { withFileTypes: true })) {
      const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, url);
      if (entry.isDirectory()) await walk(child);
      else output.push(child);
    }
  }
  await walk(rootPath);
  return output;
}

const contracts = JSON.parse(await read('docs/developers/contracts.json'));
const markets = Object.values(contracts.networks.mainnet.jtokens);
const active = markets.filter((market) => market.status === 'active');
const legacy = markets.filter((market) => market.status === 'legacy');
check(markets.length === 24, `contracts.json must expose 24 markets, found ${markets.length}`);
check(active.length === 18, `contracts.json must expose 18 active markets, found ${active.length}`);
check(legacy.length === 6, `contracts.json must expose 6 legacy markets, found ${legacy.length}`);
check(active.some((market) => market.symbol === 'jU'), 'jU must be present and active');
check(contracts._meta.schema_version === '1.2.0', 'contracts.json schema_version must be 1.2.0');
check(contracts._meta.last_verified === '2026-08-19', 'contracts.json last_verified must be 2026-08-19');
check(
  Array.isArray(contracts._meta.verification_sources) &&
    contracts._meta.verification_sources.length >= 2,
  'contracts.json must name at least two verification sources',
);

const textFiles = (await filesUnder('docs/')).filter((url) =>
  /\.(md|txt|json|ya?ml)$/.test(url.pathname) && !url.pathname.endsWith('/CHANGELOG.md'),
);
const stalePatterns = [
  /17 active \+ 6 legacy = 23/,
  /17 of 23 jToken markets/,
  /6 of 23 jToken markets/,
  /protocol exposes 23 jToken markets/i,
  /23 jToken markets in total/i,
  /per market, 22 instances/,
  /\/lend\/account\?address=\{address\}/,
];
for (const url of textFiles) {
  const content = await readFile(url, 'utf8');
  for (const pattern of stalePatterns) {
    if (pattern.test(content)) {
      failures.push(`${relative(new URL('.', ROOT).pathname, url.pathname)} contains stale ${pattern}`);
    }
  }
}

const requiredSnippets = {
  'docs/index.md': ['18 active + 6 legacy = 24', 'justlend-cli', 'justlend-utils-v2'],
  'docs/getting_started/overview.md': ['18 active + 6 legacy = 24'],
  'docs/developers/contracts_overview.md': ['18 active + 6 legacy = 24', 'per market, 23 instances'],
  'docs/ai_support/mcp_server.md': ['v1.1.3', '104 tools', '24 jToken markets in total', '| jU', '`outputSchema`', '`structuredContent`', 'get_energy_purchase_history', 'https://tegrow.ablesdxd.link', 'exact signed request'],
  'docs/ai_support/justlend_skills.md': ['`1.1.1`', '6 structured skill modules', 'justlend-energy-purchase', '8 static shortcuts', '`structuredContent`', '`rate_limit`'],
  'docs/ai_support/cli_and_sdk.md': ['justlend/justlend-cli', '`1.0.1`', '30 top-level command groups', 'energy purchase history <payer>', 'schemas/output-v1.schema.json', 'justlend/justlend-utils-v2', '--dry-run'],
  'docs/llms.txt': ['justlend-cli', 'v1.1.3', 'v1.1.1', 'justlend-utils-v2', '/lend/account?addresses={address}'],
  'docs/llms-full.txt': ['JustLend CLI — deterministic terminal automation', 'v1.0.1', 'v1.1.3', 'v1.1.1', 'JustLend V2 Utils'],
  'docs/documents/aidocs/source_of_truth.md': ['JustLend CLI', 'JustLend V2 Utils'],
};
for (const [path, snippets] of Object.entries(requiredSnippets)) {
  const content = await read(path);
  for (const snippet of snippets) check(content.includes(snippet), `${path} must include ${snippet}`);
}

const openapi = await read('docs/developers/apis/justlend_apis.yaml');
check(
  /'\/lend\/account':[\s\S]*accountAddresses[\s\S]*accountPageSize/.test(openapi),
  '/lend/account must use endpoint-specific account parameters',
);
check(
  /accountAddresses:[\s\S]*required: false[\s\S]*accountPageSize:[\s\S]*default: 50/.test(openapi),
  'account addresses must be optional and pageSize must default to 50',
);

const mcpCatalog = await read('docs/documents/aidocs/mcp_tools.md');
check(
  mcpCatalog.includes('`@justlend/mcp-server-justlend` v1.1.3'),
  'MCP catalog must identify upstream version 1.1.3',
);
check(
  (mcpCatalog.match(/^### `[^`]+`$/gm) ?? []).length === 104,
  'MCP catalog must contain exactly 104 generated tool headings',
);
check(
  (mcpCatalog.match(/^- \*\*Output schema\*\*:/gm) ?? []).length === 104,
  'MCP catalog must document output schema coverage for all 104 tools',
);
check(mcpCatalog.includes('### `get_energy_purchase_history`'), 'MCP catalog must expose public energy purchase history');
const riskSection = mcpCatalog.match(/### `get_energy_payment_risk`[\s\S]*?(?=\n### `)/)?.[0] ?? '';
check(
  riskSection.includes('for the configured wallet without replaying a signed payment') &&
    riskSection.includes('**Params**: none') &&
    !riskSection.includes('| `address` |') &&
    !riskSection.includes('| `network` |'),
  'MCP payment-risk docs must be no-argument, configured-wallet-only, and read-only',
);
check(
  mcpCatalog.includes('Uses the official JustLend production API by default'),
  'MCP catalog must document the official production API default',
);

const hook = await read('hooks/copy_dotfiles.py');
const template = await read('docs/overrides/base.html');
check(hook.includes('_copy_markdown_sources'), 'MkDocs hook must publish raw Markdown');
check(
  template.includes('type="text/markdown"') && template.includes('View raw Markdown'),
  'page template must advertise and visibly link raw Markdown',
);

if (failures.length > 0) {
  console.error(`AI consistency checks failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('PASS AI consistency: 24 markets (18 active + 6 legacy), jU present, CLI/SDK discoverable, API contract and raw Markdown verified.');
}
