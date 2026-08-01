# GitHub → Railway Deployment Setup

This guide connects your GitHub repository to Railway for automated backend deployment, and configures the frontend to use the deployed backend API.

## Step 1: Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `vincisam/nsheera` → **Deploy**
4. Once deployed, you'll see a service called `rates-proxy` (or create it manually if needed)
5. Go to the service settings and note the **Service ID**

## Step 2: Get Railway API Token & Project ID

1. In Railway dashboard, click your profile (top-right) → **Account** → **API Tokens**
2. Click **Create** and copy the token
3. Go back to your project → click **Settings** (gear icon, top-right) → copy the **Project ID**

## Step 3: Add GitHub Secrets

In your GitHub repo, go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret Name | Value |
|---|---|
| `RAILWAY_TOKEN` | Your Railway API token (from Step 2) |
| `RAILWAY_PROJECT_ID` | Your Railway Project ID (from Step 2) |
| `METALS_API_KEY` | Your actual metals.dev API key (ask if you don't have one) |
| `FRONTEND_URL` | Your GitHub Pages domain, e.g. `https://vincisam.github.io/nsheera/` |
| `RATES_BACKEND_URL` | Leave empty for now — will be filled after first deploy |

## Step 4: Get Backend URL from Railway

After the first deploy via `.github/workflows/deploy-backend.yml`:

1. Go to Railway dashboard → your project → `rates-proxy` service
2. Click **Deployments** → the green one → **View logs** to confirm it's running
3. Click the service name → **Settings** → copy the **Service URL** (looks like `https://rates-proxy-xyz.up.railway.app`)
4. Go back to GitHub → **Settings → Secrets** → edit `RATES_BACKEND_URL` and paste it

## Step 5: Update Frontend Deployment

Once `RATES_BACKEND_URL` is set, push to `main` or manually trigger `.github/workflows/deploy.yml` to rebuild the frontend with the backend URL baked in.

## What Happens

- **Backend workflow** (`.github/workflows/deploy-backend.yml`):
  - Triggers on pushes to `rates-proxy/` directory
  - Builds JAR with Maven
  - Deploys to Railway with environment variables
  - Automatically updates when you commit backend changes

- **Frontend workflow** (`.github/workflows/deploy.yml`):
  - Injects `VITE_RATES_BACKEND_URL` into the build
  - `rateSources.js` tries the backend first, then falls back to direct APIs
  - Publishes to GitHub Pages

## Testing Locally

To test the backend locally before Railway:

```bash
export METALS_API_KEY=your_actual_key
export FRONTEND_ORIGIN=http://localhost:3000
cd rates-proxy
mvn spring-boot:run
```

Then in another terminal:
```bash
npm run dev
```

Visit `http://localhost:5173` — the React dev server proxies `/api/*` to `:8080` automatically.

## Troubleshooting

- **Backend not deploying:** Check GitHub Actions logs in **Actions** tab
- **`RAILWAY_TOKEN` invalid:** Regenerate it in Railway Account settings
- **Backend URL not working:** Ensure `FRONTEND_ORIGIN` on Railway matches your GitHub Pages domain
- **Frontend still calling direct APIs:** Verify `RATES_BACKEND_URL` secret is set and workflow used `--pull always`

## Next Steps

1. Set all secrets ✓
2. Push to `main` to trigger both workflows
3. Confirm backend is live on Railway
4. Check GitHub Pages for the updated frontend
5. Open admin panel → **Rates** → click **Refresh Live Rate** → should see backend URL in diagnostics
