# 🔍 COMPLETE DIAGNOSTIC: Why AI Design Still Fails

## Root Cause Analysis

Backend property: `anthropic.api.key=${claude_code_key_amarjeet1111_eqya
sk-ant-api03-ShS...3QAA}`

This means:
- ✅ If `ANTHROPIC_API_KEY` is set on Railway → use it
- ❌ If `ANTHROPIC_API_KEY` is NOT set → defaults to **empty string**
- ❌ When empty, backend returns **HTTP 503** (Service Unavailable)
- ❌ Frontend sees 503 → falls back to direct Anthropic API
- ❌ Browser blocks CORS → Error: "Could not reach the AI design service"

---

## Step 1: Verify ANTHROPIC_API_KEY is Set on Railway

### Check if Variable Exists

1. Go to **Railway Dashboard → Your Project**
2. Click **rates-proxy** service
3. Click **Settings** (left menu or gear icon)
4. Click **Variables** tab
5. Look for `ANTHROPIC_API_KEY` in the list

### Check What's There

You should see (ONE of):
- ✅ **ANTHROPIC_API_KEY** = `sk-ant-api03-...` (GOOD - has value)
- ❌ **ANTHROPIC_API_KEY** = (empty/blank) (BAD - needs value)
- ❌ Not listed at all (BAD - needs to be added)

---

## Step 2: If ANTHROPIC_API_KEY is Missing or Empty

### Get Your Key

1. Go to https://console.anthropic.com/account/keys
2. You should see your key: `claude_code_key_amarjeet1111_eqya`
3. The key preview shows: `sk-ant-api03-3hS...3QAA`

### How to Copy the Complete Key

**Option A - Direct Copy:**
1. Click on the key row
2. Look for a **Copy icon** (📋) or **⋮ menu**
3. Click **Copy** to copy the full key to clipboard

**Option B - Reveal in Console:**
1. Open DevTools on the Anthropic console page (F12)
2. Console tab
3. Paste: `document.querySelector('[data-test="api-key-value"]')?.textContent`
4. Copy the output (full key)

**Option C - Create New Key:**
1. If you can't find the complete key, create a new one
2. Click **Create Key**
3. Give it a name: "nsheera-backend"
4. Click **Create**
5. Copy the key immediately (only shown once)

### Add to Railway

1. Railway Dashboard → rates-proxy → Settings → Variables
2. **If `ANTHROPIC_API_KEY` already exists:**
   - Click in the value field
   - Clear it completely
   - Paste your complete key (e.g., `sk-ant-api03-...` full length)
   - Click **Save**

3. **If `ANTHROPIC_API_KEY` doesn't exist:**
   - Click **New Variable**
   - Name: `ANTHROPIC_API_KEY`
   - Value: (paste your complete key)
   - Click **Save**

### Railway Auto-Redeploys

Once you click **Save**, Railway automatically:
1. Rebuilds the Docker image
2. Redeploys the service
3. Should take 3-5 minutes

Check **Deployments tab** to see status (should turn 🟢 GREEN).

---

## Step 3: Verify Backend Is Responding

Once Railway deployment is GREEN, test:

```powershell
# Test 1: Health check
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/health" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Content

# Expected: {"status":"ok"}
```

If health check works, test design endpoint:

```powershell
# Test 2: Design endpoint
$body = '{"promptText":"A simple gold ring"}'
$response = Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/design/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -ErrorAction SilentlyContinue

$response.Content | ConvertFrom-Json
```

### Expected Results:

**If ANTHROPIC_API_KEY is SET correctly:**
```json
{
  "title": "Classic Gold Ring",
  "description": "...",
  "suggestedMetal": "22K Gold",
  ...
}
```
✅ This means AI Design is working!

**If ANTHROPIC_API_KEY is NOT set:**
```json
{
  "title": "Design generation is not available right now",
  "description": "AI Design Studio is not configured on this server (missing ANTHROPIC_API_KEY)",
  ...
}
```
❌ Need to add the key to Railway.

---

## Step 4: Test Frontend

Once backend is responding with designs (not errors):

1. Go to your Vercel frontend
2. Hard refresh: **Ctrl+Shift+R**
3. Clear cache: **Ctrl+Shift+Delete** (optional)
4. Log in
5. Go to Account → AI Design Studio
6. Enter prompt: "A gold ring with a pearl"
7. Click **Generate Concept**

Should see design specs now! 

---

## Troubleshooting

### Health Check Works But Design Endpoint Returns Error

**Error: "AI design request failed (HTTP 401)"**
- ANTHROPIC_API_KEY is invalid or expired
- Solution: Create a new key at https://console.anthropic.com/account/keys

**Error: "Could not understand the AI response"**
- Claude response is malformed
- Solution: Try again or create new API key

**Error: "timeout"**
- Backend is slow or unresponsive
- Solution: Increase timeout in Railway settings or try again

---

## Action Checklist

- [ ] Check if ANTHROPIC_API_KEY exists on Railway (Settings → Variables)
- [ ] If missing or empty, copy your complete key from Anthropic console
- [ ] Add/update ANTHROPIC_API_KEY on Railway
- [ ] Wait for Railway to redeploy (3-5 min, check Deployments tab)
- [ ] Test health check endpoint (should return `{"status":"ok"}`)
- [ ] Test design endpoint (should return design JSON, not error)
- [ ] Hard refresh Vercel frontend
- [ ] Test AI Design Studio on frontend

**Do this NOW and report back the results of each test!**
