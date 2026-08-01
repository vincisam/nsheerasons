# N.S. Heera & Sons — Rates Proxy

A tiny Spring Boot service with one job: call metals.dev with your API key **server-side**,
so the key never appears in the browser-side React app. It exposes a simplified endpoint
the storefront can call safely.

## Endpoints

- `GET /api/rates` → `{ "goldPerGram": 8123.45, "silverPerGram": 96.2, "source": "metals.dev", "lastUpdated": "2026-07-17T10:15:00Z" }`
- `GET /api/health` → `{ "status": "ok" }`

Rates are cached in memory for 2 minutes so repeated page loads don't burn API quota.
If metals.dev is unreachable, it automatically falls back to gold-api.com + a live
exchange rate (both free, no key) and still returns a normal 200 response.

## Run locally

```bash
export METALS_API_KEY=UWY1VV6WCDIKUEG1YNEP476G1YNEP   # your real key
export FRONTEND_ORIGIN=http://localhost:3000            # wherever your React app runs
mvn spring-boot:run
```

Then check `curl http://localhost:8080/api/rates`.

## Build a jar

```bash
mvn -DskipTests package
java -jar target/rates-proxy-1.0.0.jar
```

## Docker

```bash
docker build -t nsheera-rates-proxy .
docker run -p 8080:8080 \
  -e METALS_API_KEY=UWY1VV6WCDIKUEG1YNEP476G1YNEP \
  -e FRONTEND_ORIGIN=https://your-storefront-domain.example \
  nsheera-rates-proxy
```

Deploy this jar/image anywhere that runs Java — Render, Railway, Fly.io, an EC2/VM,
Azure App Service, etc. — as long as it's reachable over HTTPS from your frontend.

## Important — rotate the API key

That metals.dev key was pasted in plaintext during our chat and was previously embedded
directly in the React app's source. Treat it as already exposed: generate a new key from
your metals.dev dashboard, and only ever set the new one via the `METALS_API_KEY`
environment variable here — never hard-code it in a file you'll commit or paste into a
frontend build.

## Wire up the frontend

Once this is deployed, set `RATES_BACKEND_URL` in `App.jsx` to your deployed URL, e.g.
`https://your-rates-proxy.example.com/api/rates`. The frontend already tries this backend
first and gracefully falls back to gold-api.com/goldprice.org directly if it's unreachable.
