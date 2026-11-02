
#!/bin/bash

echo "=================================="
echo "      MEMORY MONITORING SYSTEM"
echo "=================================="

total=$(free -m | awk '/Mem:/ {print $2}')
used=$(free -m | awk '/Mem:/ {print $3}')
available=$(free -m | awk '/Mem:/ {print $7}')
swap_total=$(free -m | awk '/Swap:/ {print $2}')
swap_used=$(free -m | awk '/Swap:/ {print $3}')

usage=$(awk -v u="$used" -v t="$total" \
    'BEGIN {if (t>0) printf "%.2f", u*100/t; else print "0"}')

echo "Total RAM     : ${total} MB"
echo "Used RAM      : ${used} MB"
echo "Available RAM : ${available} MB"
echo "Swap Total    : ${swap_total} MB"
echo "Swap Used     : ${swap_used} MB"
echo "RAM Usage     : ${usage}%"

echo "=================================="
