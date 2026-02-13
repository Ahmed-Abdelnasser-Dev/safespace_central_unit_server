#!/bin/bash

# Test Script for Blocked Lanes Decision Making
# Tests various lane blocking scenarios with polygon intersections

API_URL="http://localhost:5000/api/accident-detected"
NODE_ID="safe-space-node-001"
IMAGE_PATH="/home/nasser/Downloads/test-image.jpg"
LAT="24.7136"
LONG="46.6753"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Blocked Lanes Decision Making Test Suite${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Test 1: Single Lane Blocked (Lane 1)
echo -e "${YELLOW}Test 1: Lane 1 Blocked (Left-most)${NC}"
echo "Expected: blocked,right,open,open | Speed: 80→70 km/h (12.5% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=1" \
  -F 'accidentPolygon={"points":[{"x":100,"y":300},{"x":300,"y":300},{"x":300,"y":600},{"x":100,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 2: Single Lane Blocked (Lane 2 - Middle)
echo -e "${YELLOW}Test 2: Lane 2 Blocked (Middle)${NC}"
echo "Expected: left,blocked,right,open | Speed: 80→70 km/h (12.5% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=2" \
  -F 'accidentPolygon={"points":[{"x":500,"y":300},{"x":700,"y":300},{"x":700,"y":600},{"x":500,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 3: Single Lane Blocked (Lane 3)
echo -e "${YELLOW}Test 3: Lane 3 Blocked${NC}"
echo "Expected: open,left,blocked,right | Speed: 80→70 km/h (12.5% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=3" \
  -F 'accidentPolygon={"points":[{"x":900,"y":300},{"x":1100,"y":300},{"x":1100,"y":600},{"x":900,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 4: Single Lane Blocked (Lane 4 - Right-most)
echo -e "${YELLOW}Test 4: Lane 4 Blocked (Right-most)${NC}"
echo "Expected: open,open,left,blocked | Speed: 80→70 km/h (12.5% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=4" \
  -F 'accidentPolygon={"points":[{"x":1300,"y":300},{"x":1500,"y":300},{"x":1500,"y":600},{"x":1300,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 5: Two Adjacent Lanes Blocked (Lanes 1 & 2)
echo -e "${YELLOW}Test 5: Lanes 1 & 2 Blocked (Adjacent)${NC}"
echo "Expected: blocked,blocked,right,open | Speed: 80→60 km/h (25% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=1" \
  -F 'accidentPolygon={"points":[{"x":100,"y":300},{"x":700,"y":300},{"x":700,"y":600},{"x":100,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 6: Two Adjacent Lanes Blocked (Lanes 2 & 3)
echo -e "${YELLOW}Test 6: Lanes 2 & 3 Blocked (Adjacent)${NC}"
echo "Expected: left,blocked,blocked,right | Speed: 80→60 km/h (25% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=2" \
  -F 'accidentPolygon={"points":[{"x":500,"y":300},{"x":1100,"y":300},{"x":1100,"y":600},{"x":500,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 7: Two Adjacent Lanes Blocked (Lanes 3 & 4)
echo -e "${YELLOW}Test 7: Lanes 3 & 4 Blocked (Adjacent)${NC}"
echo "Expected: open,left,blocked,blocked | Speed: 80→60 km/h (25% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=3" \
  -F 'accidentPolygon={"points":[{"x":900,"y":300},{"x":1500,"y":300},{"x":1500,"y":600},{"x":900,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 8: Two Non-Adjacent Lanes Blocked (Lanes 1 & 3)
echo -e "${YELLOW}Test 8: Lanes 1 & 3 Blocked (Non-Adjacent)${NC}"
echo "Expected: blocked,open,blocked,right | Speed: 80→60 km/h (25% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=1" \
  -F 'accidentPolygon={"points":[{"x":100,"y":300},{"x":300,"y":300},{"x":300,"y":600},{"x":1100,"y":600},{"x":1100,"y":300},{"x":900,"y":300},{"x":900,"y":600},{"x":100,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 9: Two Non-Adjacent Lanes Blocked (Lanes 2 & 4)
echo -e "${YELLOW}Test 9: Lanes 2 & 4 Blocked (Non-Adjacent)${NC}"
echo "Expected: left,blocked,open,blocked | Speed: 80→60 km/h (25% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=2" \
  -F 'accidentPolygon={"points":[{"x":500,"y":300},{"x":700,"y":300},{"x":700,"y":600},{"x":1500,"y":600},{"x":1500,"y":300},{"x":1300,"y":300},{"x":1300,"y":600},{"x":500,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 10: Three Lanes Blocked (Lanes 1, 2, 3)
echo -e "${YELLOW}Test 10: Lanes 1, 2, 3 Blocked (75%)${NC}"
echo "Expected: blocked,blocked,blocked,right | Speed: 80→50 km/h (37.5% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=1" \
  -F 'accidentPolygon={"points":[{"x":100,"y":300},{"x":1100,"y":300},{"x":1100,"y":600},{"x":100,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 11: Three Lanes Blocked (Lanes 2, 3, 4)
echo -e "${YELLOW}Test 11: Lanes 2, 3, 4 Blocked (75%)${NC}"
echo "Expected: left,blocked,blocked,blocked | Speed: 80→50 km/h (37.5% reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=2" \
  -F 'accidentPolygon={"points":[{"x":500,"y":300},{"x":1500,"y":300},{"x":1500,"y":600},{"x":500,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 12: All Lanes Blocked (100%)
echo -e "${YELLOW}Test 12: All Lanes Blocked (100% - CRITICAL)${NC}"
echo "Expected: blocked,blocked,blocked,blocked | Speed: 80→40 km/h (50% reduction - MIN)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=1" \
  -F 'accidentPolygon={"points":[{"x":100,"y":300},{"x":1500,"y":300},{"x":1500,"y":600},{"x":100,"y":600}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"
sleep 2

# Test 13: No Lanes Blocked (Edge Case)
echo -e "${YELLOW}Test 13: No Lanes Blocked (Outside road area)${NC}"
echo "Expected: open,open,open,open | Speed: 80 km/h (no reduction)"
curl -X POST $API_URL \
  -F "nodeId=$NODE_ID" \
  -F "lat=$LAT" \
  -F "long=$LONG" \
  -F "lanNumber=1" \
  -F 'accidentPolygon={"points":[{"x":50,"y":50},{"x":70,"y":50},{"x":70,"y":70},{"x":50,"y":70}],"baseWidth":1920,"baseHeight":1080}' \
  -F "media=@$IMAGE_PATH" \
  -s -o /dev/null -w "Status: %{http_code}\n\n"

echo -e "\n${BLUE}================================================${NC}"
echo -e "${GREEN}           Test Suite Completed!${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "\nCheck server logs for detailed decision analysis."
echo -e "Look for: ${GREEN}[DECISION]${NC} and ${GREEN}[DECISION AUDIT]${NC} log entries\n"
