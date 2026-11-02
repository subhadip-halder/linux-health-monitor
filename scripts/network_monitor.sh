
#!/bin/bash

echo "=================================="
echo "      NETWORK MONITORING SYSTEM"
echo "=================================="

echo ""
echo "Network Interfaces:"
interface_output=""
if command -v ip >/dev/null 2>&1; then
    interface_output=$(ip -br addr 2>/dev/null)
fi

if [ -n "$interface_output" ]; then
    printf '%s\n' "$interface_output"
else
    for path in /sys/class/net/*; do
        [ -e "$path" ] || continue
        interface=${path##*/}
        state=$(tr '[:lower:]' '[:upper:]' < "$path/operstate" 2>/dev/null)
        state=${state:-UNKNOWN}
        echo "$interface $state -"
    done
fi

echo ""
echo "Network Traffic:"

for interface in $(ls /sys/class/net); do
    if [ "$interface" != "lo" ]; then
        rx=$(cat /sys/class/net/$interface/statistics/rx_bytes)
        tx=$(cat /sys/class/net/$interface/statistics/tx_bytes)

        rx_mb=$(awk -v b="$rx" 'BEGIN {printf "%.2f", b/1048576}')
        tx_mb=$(awk -v b="$tx" 'BEGIN {printf "%.2f", b/1048576}')

        echo "$interface"
        echo "Received: $rx_mb MB"
        echo "Sent: $tx_mb MB"
        echo "----------------------------"
    fi
done

echo "=================================="
