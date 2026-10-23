# JustLend DAO Documentation
This is the official developer documentation for the JustLend DAO, providing comprehensive development guides and API references.

## 🚀 Community
- [JUST-Defi](https://t.me/just_defi)
- [JustLend DAO Official](https://t.me/officialjustlend)

## 🔧 Tech Stack

- [MkDocs](https://www.mkdocs.org/) - Static site generator
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) - Theme
- [GitHub Pages](https://pages.github.com/) - Hosting service
- [GitHub Actions](https://github.com/features/actions) - CI/CD for deployment

## 🛠️ Local Development

The Node.js verification scripts use **Node.js 24.22.1**, pinned in `.nvmrc` and CI.
With nvm installed, run `nvm install && nvm use` before the Node.js checks below.
MkDocs itself uses Python and the dependencies in `requirements.txt`.

```bash
python -m pip install -r requirements.txt
mkdocs serve
```

Before opening a pull request, run:

```bash
mkdocs build --strict
```

For the documentation verification regressions (offline; no wallet signing or broadcasts):

```bash
python -m pip install -r requirements-test.txt
node scripts/verify-ai-consistency.mjs
node scripts/normalize-mcp-catalog.mjs --check
node --test scripts/api-acceptance.test.mjs
python scripts/test-docs-regressions.py
mkdocs build --strict
DOCS_SITE_DIR=site python scripts/test-docs-regressions.py
```

Product-facing interface sources, targets, verification dates and coverage belong in `docs/developers/abis/manifest.json` and the related reference pages. Offline observations used by regressions are in `scripts/fixtures/docs-verification/abi-provenance-20261014.json`, outside the published `docs/` tree. Issue checklists, acceptance status and full collection archives belong in the PR or local review report, not site navigation or search.

After importing the generated MCP catalog, run `node scripts/normalize-mcp-catalog.mjs`
to apply the docs-local table escaping and transaction/configuration distinctions.


## 🤝 Contact Us

- Official Website: [Documentation Website](https://docs.justlend.org/)
- JustLend Website: [App Website](https://justlend.org)

## 📚 Related Links

- [JustLend Official Site](https://www.justlend.org/)
- [Just Official Site](https://just.network/)
