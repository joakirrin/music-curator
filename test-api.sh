#!/bin/bash
# test-api.sh - Test the OpenAI proxy endpoint

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing OpenAI API Endpoint${NC}"
echo "================================"
echo ""

# Default to localhost if no argument provided
URL="${1:-http://localhost:3000}/api/openai"

echo -e "Testing: ${YELLOW}${URL}${NC}"
echo ""

# Test payload
PAYLOAD='{"messages":[{"role":"user","content":"Say hello in exactly 5 words"}]}'

echo "Sending request..."
echo ""

# Make the request and capture response
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${URL}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")

# Split response and status code
HTTP_BODY=$(echo "$RESPONSE" | sed '$d')
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1)

echo "HTTP Status: ${HTTP_STATUS}"
echo ""

# Check status code
if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Success!${NC}"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"
    exit 0
elif [ "$HTTP_STATUS" -eq 404 ]; then
    echo -e "${RED}✗ Failed: 404 Not Found${NC}"
    echo ""
    echo "Possible issues:"
    echo "  1. API route not being served (are you using 'npx vercel dev'?)"
    echo "  2. Wrong URL (check if /api/openai exists)"
    echo "  3. vercel.json might be rewriting /api/* routes incorrectly"
    exit 1
elif [ "$HTTP_STATUS" -eq 500 ]; then
    echo -e "${RED}✗ Failed: 500 Internal Server Error${NC}"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY"
    echo ""
    echo "Possible issues:"
    echo "  1. OPENAI_API_KEY not set in environment"
    echo "  2. OpenAI API error"
    echo "  3. Runtime error in api/openai.ts"
    exit 1
else
    echo -e "${RED}✗ Failed: HTTP ${HTTP_STATUS}${NC}"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY"
    exit 1
fi
