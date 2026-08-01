# How to Get Your Anthropic API Key (Free)

## Step-by-Step

### Step 1: Go to Anthropic Console
Visit: https://console.anthropic.com/account/keys

### Step 2: Create Account (if needed)
- If you don't have an account, click **Sign Up**
- Use email or Google/GitHub sign-in
- Verify email
- **Free tier available** — no credit card required to create an API key

### Step 3: Create API Key
1. Click **Create Key**
2. Give it a name (e.g., "nsheera-jewellers")
3. Click **Create**
4. **IMMEDIATELY copy the key** — it only shows once and won't appear again

### Step 4: Add to Railway
1. Go to **Railway Dashboard → Your Project → rates-proxy service**
2. Click **Settings → Variables**
3. Add new variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: (paste the key you just copied)
4. Click **Save**
5. Railway auto-redeploys (~2-3 minutes)

### Step 5: Test Backend
```bash
# Wait for Railway to redeploy (check Deployments tab)
curl https://nsheera-rates-proxy-production.up.railway.app/api/health
# Should return: {"status":"ok"}
```

## Common Questions

**Q: Is it free?**  
A: Yes. Anthropic provides free API keys. You only pay for actual API usage (Claude calls).

**Q: Where do I find the key?**  
A: https://console.anthropic.com/account/keys — that's the only place.

**Q: What if I lose it?**  
A: You can't retrieve it. Generate a new one and delete the old one.

**Q: How much does it cost to use?**  
A: Anthropic charges per token. For a jewellery design request (~2000 tokens), expect ~$0.01-0.02 per request. Very cheap for development.

**Q: Do I need to add a payment method?**  
A: Not for the free tier API key. Only when you need higher rate limits or usage tracking.

---

## Action

1. Go to https://console.anthropic.com/account/keys
2. Create account (if needed)
3. Click **Create Key**
4. Copy the key immediately
5. Add it to Railway (see Step 4 above)
6. Wait 2-3 min for Railway to redeploy
7. Test with `curl` command (see Step 5 above)

**Report back once you've done this and let me know if the curl health check works!**
