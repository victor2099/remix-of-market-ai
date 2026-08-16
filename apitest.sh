#!/usr/bin/env bash
# shellcheck disable=SC2181
set -uo pipefail

# Full backend endpoint test suite for the Market AI frontend.
# Reads VITE_API_BASE_URL from .env and calls the API directly.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  export $(grep -E '^VITE_API_BASE_URL=' "$ENV_FILE" | xargs)
fi

BASE="${VITE_API_BASE_URL:-http://localhost:8000}"
BASE="${BASE%/}"

echo "================================"
echo "Backend API test suite"
echo "Base URL: $BASE"
echo "================================"

PASS=0
FAIL=0
SKIPPED=0
LAST_BODY=""

# $1 method, $2 path, $3 expected status, $4 optional body
request() {
  local method="$1" path="$2" expected="$3" body="${4:-}"
  local url="$BASE$path"
  local tmp_headers=$(mktemp)
  local tmp_body=$(mktemp)
  local status

  local curl_args=( -s -D "$tmp_headers" -o "$tmp_body" -w "%{http_code}" )
  if [[ "$method" != "GET" && "$method" != "DELETE" && -n "$body" ]]; then
    curl_args+=( -X "$method" -H "content-type: application/json" -d "$body" )
  elif [[ "$method" != "GET" ]]; then
    curl_args+=( -X "$method" )
  fi
  if [[ -n "${TOKEN:-}" ]]; then
    curl_args+=( -H "authorization: Bearer $TOKEN" )
  fi

  status=$(curl "${curl_args[@]}" "$url")
  LAST_BODY=$(cat "$tmp_body")

  local label="$method $path"
  if [[ "$status" == "$expected" ]]; then
    echo "✅  $label -> $status"
    ((PASS++)) || true
  else
    echo "❌  $label -> expected $expected, got $status"
    echo "     response: ${LAST_BODY:0:200}"
    ((FAIL++)) || true
  fi

  rm -f "$tmp_headers" "$tmp_body"
  echo "$status"
}

# Extract a JSON value using Python; prints empty string on missing/error.
# Usage: jsonpath '{json string}' '{python expression using variable data}'
jsonpath() {
  local json="$1" expr="$2"
  python3 -c "import json,sys; data=json.loads(sys.argv[1]); print($expr)" "$json" 2>/dev/null || echo ""
}

echo ""
echo "--- Public / discovery ---"
request GET "/openapi.json" 200
request GET "/products" 200
request GET "/sellers" 200

echo ""
echo "--- Auth ---"
TS=$(date +%s)
EMAIL="apitest_${TS}@example.com"
PASSWORD="TestPass123!"

request POST "/auth/register" 201 "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"first_name\":\"Api\",\"last_name\":\"Test\",\"role\":\"buyer\"}"
LOGIN_STATUS=$(curl -s -o /tmp/login.json -w "%{http_code}" -X POST -H "content-type: application/x-www-form-urlencoded" -d "username=$EMAIL&password=$PASSWORD" "$BASE/auth/login")
if [[ "$LOGIN_STATUS" == "200" ]]; then
  echo "✅  POST /auth/login -> 200"
  ((PASS++)) || true
  TOKEN=$(jsonpath "$(cat /tmp/login.json)" "data.get('access_token','')")
  USER_ID=$(jsonpath "$(cat /tmp/login.json)" "data.get('user',{}).get('id','')")
else
  echo "❌  POST /auth/login -> expected 200, got $LOGIN_STATUS"
  ((FAIL++)) || true
fi

if [[ -z "${TOKEN:-}" ]]; then
  echo ""
  echo "No access token returned; skipping authenticated tests."
  exit 1
fi

echo ""
echo "--- Seller profile ---"
request POST "/sellers/me" 201 "{\"business_name\":\"API Test Store\",\"contact_email\":\"$EMAIL\"}"
SELLER_ME=$(curl -s -H "authorization: Bearer $TOKEN" "$BASE/sellers/me")
SELLER_ID=$(jsonpath "$SELLER_ME" "data.get('seller',{}).get('id','')")
if [[ -z "$SELLER_ID" ]]; then
  SELLER_ID=$(curl -s -H "authorization: Bearer $TOKEN" "$BASE/sellers" | python3 -c "import json,sys; data=json.load(sys.stdin); arr=data if isinstance(data,list) else (data.get('results') or []); print(arr[0]['id'] if arr else '')")
fi

echo ""
echo "--- Authenticated products ---"
request POST "/products" 201 "{\"name\":\"API Test Widget\",\"description\":\"Created by apitest\",\"price\":99.99,\"currency\":\"USD\",\"category\":\"Electronics\",\"seller_id\":\"$SELLER_ID\"}"
PRODUCT_ID=$(jsonpath "$LAST_BODY" "data.get('product',{}).get('id','')")
if [[ -n "$PRODUCT_ID" ]]; then
  request GET "/products/$PRODUCT_ID" 200
  request PUT "/products/$PRODUCT_ID" 200 "{\"name\":\"Updated Widget\",\"price\":89.99}"
else
  echo "⚠️  Could not determine product id; skipping product detail/update tests"
  ((SKIPPED+=2)) || true
fi

echo ""
echo "--- Buyer agents ---"
request POST "/buyer-agents/buyer-agents" 201 "{\"objective\":\"Find the best deals on electronics\",\"preferences\":{}}"
BUYER_AGENT_ID=$(jsonpath "$LAST_BODY" "data.get('agent',{}).get('id','')")
if [[ -n "$BUYER_AGENT_ID" ]]; then
  request GET "/buyer-agents/buyer-agents/$BUYER_AGENT_ID" 200
  request POST "/buyer-agents/buyer-agents/$BUYER_AGENT_ID/recommend" 200 "{\"intent\":\"Find a phone under 500\"}"
else
  echo "⚠️  Could not determine buyer agent id; skipping detail/recommend tests"
  ((SKIPPED+=2)) || true
fi

echo ""
echo "--- Seller agents ---"
request POST "/seller-agents" 201 "{\"name\":\"Test Seller Agent\",\"seller_id\":\"$SELLER_ID\"}"
SELLER_AGENT_ID=$(jsonpath "$LAST_BODY" "data.get('agent',{}).get('id','')")
if [[ -n "$SELLER_AGENT_ID" ]]; then
  request GET "/seller-agents/$SELLER_AGENT_ID" 200
  request GET "/seller-agents/$SELLER_AGENT_ID/history" 200
else
  echo "⚠️  Could not determine seller agent id; skipping detail/history tests"
  ((SKIPPED+=2)) || true
fi

echo ""
echo "--- Inventory ---"
if [[ -n "$PRODUCT_ID" && -n "$SELLER_ID" ]]; then
  request POST "/inventory" 201 "{\"product_id\":\"$PRODUCT_ID\",\"quantity\":100,\"seller_id\":\"$SELLER_ID\"}"
  INV_ID=$(jsonpath "$LAST_BODY" "data.get('id','')")
  if [[ -n "$INV_ID" ]]; then
    request GET "/inventory/$INV_ID" 200
    request PATCH "/inventory/$INV_ID" 200 "{\"quantity\":200}"
    request POST "/inventory/$INV_ID/reserve" 200 "{\"quantity\":1}"
    request POST "/inventory/$INV_ID/release" 200 "{\"quantity\":1}"
  else
    echo "⚠️  Could not determine inventory id; skipping inventory detail tests"
    ((SKIPPED+=4)) || true
  fi
else
  echo "⚠️  Could not determine product/seller id; skipping inventory tests"
  ((SKIPPED+=5)) || true
fi

echo ""
echo "--- Negotiations ---"
if [[ -n "$SELLER_ID" && -n "$PRODUCT_ID" && -n "$USER_ID" ]]; then
  request POST "/negotiations" 201 "{\"buyer_id\":\"$USER_ID\",\"seller_id\":\"$SELLER_ID\",\"product_id\":\"$PRODUCT_ID\",\"initial_offer\":50,\"max_price\":80,\"currency\":\"USD\"}"
  NEG_ID=$(jsonpath "$LAST_BODY" "data.get('id','')")
  if [[ -n "$NEG_ID" ]]; then
    request GET "/negotiations/$NEG_ID" 200
    request POST "/negotiations/$NEG_ID/offers" 200 "{\"price\":55}"
    request POST "/negotiations/$NEG_ID/accept" 200 "{}"
  else
    echo "⚠️  Could not determine negotiation id; skipping negotiation detail tests"
    ((SKIPPED+=3)) || true
  fi
else
  echo "⚠️  Could not determine seller/product/user id; skipping negotiation tests"
  ((SKIPPED+=4)) || true
fi

echo ""
echo "--- Orders ---"
request GET "/orders/user/me" 200

echo ""
echo "--- Cleanup ---"
if [[ -n "$PRODUCT_ID" ]]; then
  request DELETE "/products/$PRODUCT_ID" 200
fi

echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed, $SKIPPED skipped"
echo "================================"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
