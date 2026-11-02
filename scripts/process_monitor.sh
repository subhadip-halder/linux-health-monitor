
#!/bin/bash

echo "=================================="
echo "       PROCESS MONITORING"
echo "=================================="

echo ""
echo "Top 10 CPU Consuming Processes:"
echo ""

ps aux --sort=-%cpu | head -n 11

echo ""
echo "Total Running Processes:"

ps -e --no-headers | wc -l

echo "=================================="
