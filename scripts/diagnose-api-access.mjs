// Temporary fork-only diagnostic: no credentials, alternate hosts, or header spoofing.
import { lookup, resolveCname } from 'node:dns/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const url = 'https://openapi.just.network/lend/jtoken';
const selected = new Set(['server', 'content-type', 'date', 'location', 'via', 'x-cache',
  'x-amz-cf-id', 'x-amz-cf-pop', 'cf-ray', 'cf-mitigated', 'x-request-id', 'x-amzn-requestid']);
function headers(entries) {
  return Object.fromEntries([...entries].map(([k, v]) => [k.toLowerCase(), v]).filter(([k]) => selected.has(k)));
}
function summarize(body) {
  try {
    const data = JSON.parse(body);
    return { format: 'json', code: data.code, message: data.message, tokenCount: data.data?.tokenList?.length };
  } catch {
    return { format: 'non-json', title: body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
      text: body.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000) };
  }
}
const report = { generatedAt: new Date().toISOString(), url, node: process.version,
  platform: process.platform, runnerOS: process.env.RUNNER_OS ?? null,
  proxyVariablesPresent: ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']
    .filter((key) => Boolean(process.env[key])) };
report.dns = await lookup('openapi.just.network', { all: true }).catch((e) => ({ error: e.message }));
report.cname = await resolveCname('openapi.just.network').catch((e) => ({ error: e.code }));
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000), redirect: 'manual' });
  report.nodeFetch = { status: response.status, url: response.url, headers: headers(response.headers),
    body: summarize(await response.text()) };
} catch (e) { report.nodeFetch = { error: e.message, cause: e.cause?.code }; }
try {
  const { stdout } = await exec('curl', ['--silent', '--show-error', '--max-time', '20',
    '--include', url], { maxBuffer: 2_000_000 });
  const split = stdout.lastIndexOf('\r\nHTTP/');
  const response = split >= 0 ? stdout.slice(split + 2) : stdout;
  const boundary = response.indexOf('\r\n\r\n');
  if (boundary < 0) throw new Error('Missing HTTP header separator');
  const lines = response.slice(0, boundary).split('\r\n');
  report.curl = { statusLine: lines.shift(),
    headers: headers(lines.filter((line) => line.includes(':')).map((line) => {
      const i = line.indexOf(':'); return [line.slice(0, i), line.slice(i + 1).trim()];
    })), body: summarize(response.slice(boundary + 4)) };
} catch (e) { report.curl = { error: e.message }; }
console.log(JSON.stringify(report, null, 2));
