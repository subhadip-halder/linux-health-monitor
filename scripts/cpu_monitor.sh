
#!/bin/bash

echo "=================================="
echo "       CPU MONITORING SYSTEM"
echo "=================================="

read -r cpu user nice system idle iowait irq softirq steal rest < /proc/stat
total1=$((user + nice + system + idle + iowait + irq + softirq + steal))
idle1=$((idle + iowait))

sleep 1

read -r cpu user nice system idle iowait irq softirq steal rest < /proc/stat
total2=$((user + nice + system + idle + iowait + irq + softirq + steal))
idle2=$((idle + iowait))

total_diff=$((total2 - total1))
idle_diff=$((idle2 - idle1))

if [ "$total_diff" -gt 0 ]; then
    usage=$(awk -v t="$total_diff" -v i="$idle_diff" \
        'BEGIN {printf "%.2f", (t-i)*100/t}')
    echo "CPU Usage: $usage%"
else
    echo "CPU Usage: Unable to calculate"
fi

echo "=================================="
