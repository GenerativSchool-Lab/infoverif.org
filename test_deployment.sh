#!/bin/bash
# Test deployment endpoints

# Set your Railway service URL here
BASE_URL="${1:-https://your-service.up.railway.app}"

echo "Testing deployment at: $BASE_URL"
echo ""

# Test health endpoint
echo "1. Testing /health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${BASE_URL}/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Health check passed!"
    echo "Response: $BODY"
else
    echo "❌ Health check failed with status: $HTTP_STATUS"
    echo "Response: $BODY"
fi

echo ""
echo "2. Testing /method-card endpoint..."
METHOD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${BASE_URL}/method-card")
HTTP_STATUS=$(echo "$METHOD_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$METHOD_RESPONSE" | grep -v "HTTP_STATUS")

if [ "$HTTP_STATUS" == "200" ]; then
    echo "✅ Method card endpoint works!"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ Method card failed with status: $HTTP_STATUS"
    echo "Response: $BODY"
fi

echo ""
echo "3. Testing with Python requests..."
python3 <<EOF
import requests
import sys

base_url = "$BASE_URL"

print("Testing endpoints with Python...")
print(f"Base URL: {base_url}\n")

# Test health
try:
    response = requests.get(f"{base_url}/health", timeout=10)
    print(f"✅ /health: Status {response.status_code}")
    print(f"   Response: {response.json()}")
except Exception as e:
    print(f"❌ /health failed: {e}")

# Test method card
try:
    response = requests.get(f"{base_url}/method-card", timeout=10)
    print(f"✅ /method-card: Status {response.status_code}")
    print(f"   Title: {response.json().get('title', 'N/A')}")
except Exception as e:
    print(f"❌ /method-card failed: {e}")

# Test CORS headers
try:
    response = requests.options(f"{base_url}/health", timeout=10)
    cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
    if cors_headers:
        print(f"✅ CORS headers present: {list(cors_headers.keys())}")
    else:
        print("⚠️  No CORS headers found")
except Exception as e:
    print(f"⚠️  CORS check failed: {e}")

EOF





