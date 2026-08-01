# Media Analyzer (parked)

This is **not part of the N.S. Heera & Sons jewellery site**. It's a separate,
unrelated tool that ended up mixed into the same project folder — a small Express
server (`index.js`) that accepts an uploaded image/video and asks Google Gemini to
describe or analyze it, plus a frontend fragment (`MediaAnalyzer.jsx`) built for
stock/crypto chart analysis (trend direction, EMA crossovers, price levels).

`MediaAnalyzer.jsx` is not imported anywhere in the jewellery site's `src/App.jsx` —
it was dead code there. It's kept here in case it's still wanted for something else.

`gemini-backend-deps/` next to this folder is an empty scaffold (just a
`package.json`/lockfile with dependencies installed, no actual server file) — the
real server logic for this tool is `index.js` in this folder.

## Running it standalone

```bash
cd standalone-tools/media-analyzer
npm install
cp .env.example .env   # add your own GEMINI_API_KEY
npm start
```

This has its own `package.json` now — it no longer shares dependencies with the
jewellery site's frontend `package.json`.
