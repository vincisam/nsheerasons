# 🔑 FIX: Add Your Anthropic API Key to Railway Properly

## The Issue

Backend is looking for `ANTHROPIC_API_KEY` environment variable on Railway, but it's either:
1. Not set at all
2. Truncated/incomplete
3. Wrong format

## Solution

### Step 1: Get Your Complete API Key

1. Go to https://console.anthropic.com/account/keys
2. You should see your key from the screenshot:
   - Name: `claude_code_key_amarjeet1111_eqya`
   - Starts with: `sk-ant-api03-3hS...3QAA`

3. **Click on the key name or the row** to reveal/copy the full key

4. If you see an **"eye" icon** 👁️ or **"Copy" button**, click it to reveal the complete key

5. **Copy the entire key** (e.g., `sk-ant-api03-3hS...........................3QAA`)

### Step 2: Add to Railway

1. Open **Railway Dashboard**
2. Go to **Your Project → rates-proxy**
3. Click **Settings** (left menu)
4. Click **Variables**
5. **Find or create** a variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: (paste your complete key - starts with `sk-ant-`)
6. Click **Save** (Railway auto-redeploys)

### Step 3: Verify It's Set

1. Wait 2-3 minutes for Railway to redeploy
2. Check **Deployments tab** - should be GREEN
3. Run this test:

```powershell
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/health" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Content
```

Should return: `{"status":"ok"}`

### Step 4: Test AI Design

1. Go to your Vercel frontend
2. Hard refresh: **Ctrl+Shift+R**
3. Log in → Account → AI Design Studio
4. Enter prompt: "A gold ring with a pearl"
5. Click **Generate Concept**

Should work now!

---

## How to Copy the Full Key from Anthropic Console

**On the key row, you should see:**
- Key name: `claude_code_key_amarjeet1111_eqya`
- Key preview: `sk-ant-api03-3hS...3QAA` (truncated)
- Action button: Either **Copy** icon or **⋮ menu**

**Click the Copy button or ⋮ → Copy** to get the full key to your clipboard.

---

## Common Issues

**Q: I see the key but it's still truncated in Railway variables?**  
A: That's normal. As long as you pasted the COMPLETE key (starts with `sk-ant-` and ends with letters/numbers), Railway will recognize it.

**Q: How do I know if the full key was pasted?**  
A: Check the length. Anthropic keys are typically 60-80+ characters. If it's shorter, it was truncated.

**Q: Is the key safe to paste?**  
A: Yes, once it's in Railway variables, only your backend code can access it. The frontend never sees it.

---

**Do this NOW and let me know when Railway redeploys and turns GREEN, then test AI Design Studio!**
