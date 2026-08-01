#!/bin/bash
# Vercel Frontend + Railway Backend Connectivity Test
# Run this to diagnose the "Could not reach AI design service" error

echo "=== Vercel + Railway Backend Diagnostic Test ==="
echo ""

# Test 1: Backend Health
echo "1. Testing backend health check..."
HEALTH=$(curl -s https://nsheera-rates-proxy-production.up.railway.app/api/health)
if [[ $HEALTH == *"ok"* ]]; then
    echo "✓ Backend is RUNNING"
else
    echo "✗ Backend health check FAILED"
    echo "  Response: $HEALTH"
fi
echo ""

# Test 2: Design Endpoint Exists
echo "2. Testing design endpoint..."
DESIGN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST https://nsheera-rates-proxy-production.up.railway.app/api/design/generate \
  -H "Content-Type: application/json" \
  -d '{"promptText":"test"}')
DESIGN_HTTP=$(echo "$DESIGN_RESPONSE" | tail -n 1)
DESIGN_BODY=$(echo "$DESIGN_RESPONSE" | head -n -1)

case $DESIGN_HTTP in
  200) 
    echo "✓ Design endpoint responding (HTTP 200)"
    echo "  Backend is configured and Anthropic key is SET"
    ;;
  503) 
    echo "✗ Design endpoint returned HTTP 503"
    echo "  ANTHROPIC_API_KEY is NOT set on Railway"
    echo "  Fix: Set ANTHROPIC_API_KEY in Railway project settings"
    ;;
  404) 
    echo "✗ Design endpoint returned HTTP 404 (NOT FOUND)"
    echo "  Endpoint doesn't exist on backend"
    ;;
  *)
    echo "✗ Design endpoint returned HTTP $DESIGN_HTTP"
    echo "  Response: $DESIGN_BODY"
    ;;
esac
echo ""

# Test 3: Rates Endpoint
echo "3. Testing rates endpoint..."
RATES=$(curl -s https://nsheera-rates-proxy-production.up.railway.app/api/rates)
if [[ $RATES == *"goldPerGram"* ]]; then
    echo "✓ Rates endpoint working"
else
    echo "✗ Rates endpoint failed"
fi
echo ""

# Test 4: Railway Environment Variables (readable via health endpoint logic)
echo "4. Checking if ANTHROPIC_API_KEY is set..."
echo "  If HTTP 200 above: KEY IS SET ✓"
echo "  If HTTP 503 above: KEY IS MISSING ✗"
echo ""

echo "=== Summary ==="
echo "HTTP 200 on design endpoint = Everything working, check Vercel env vars"
echo "HTTP 503 on design endpoint = Set ANTHROPIC_API_KEY on Railway"
echo "HTTP 404 on design endpoint = Backend endpoint missing"
echo ""
echo "Next: Check Vercel dashboard for VITE_DESIGN_BACKEND_URL env var scope"
