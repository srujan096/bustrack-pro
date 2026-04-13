#!/bin/bash
# Start server and run test in parallel
# The trick: keep the bash process alive so the server doesn't get orphaned

cd /home/z/my-project

# Start server in background  
npx next dev -p 3000 > /home/z/my-project/download/next-test.log 2>&1 &
SERVER_PID=$!

# Function to check if server is alive
check_server() {
  ss -tlnp 2>/dev/null | grep -q ":3000 "
}

# Wait for server to start (up to 20s)
echo "Waiting for server..."
for i in $(seq 1 20); do
  sleep 1
  if check_server; then
    echo "Server started after ${i}s"
    break
  fi
done

if ! check_server; then
  echo "Server failed to start"
  exit 1
fi

# Wait a bit more for initial compilation
sleep 3

# Check server still alive
if ! check_server; then
  echo "Server died before test"
  exit 1
fi

echo "Running Playwright test..."
node /home/z/my-project/qa-playwright.js

TEST_EXIT=$?

# Cleanup
kill $SERVER_PID 2>/dev/null

echo "Test completed with exit code: $TEST_EXIT"
exit $TEST_EXIT
