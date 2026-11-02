
#!/bin/bash

echo "=================================="
echo "       SYSTEM INFORMATION"
echo "=================================="

echo "Hostname      : $(hostname)"
echo "Operating Sys : $(grep '^PRETTY_NAME=' /etc/os-release | cut -d '"' -f 2)"
echo "Kernel        : $(uname -r)"
echo "Architecture  : $(uname -m)"
echo "Uptime        : $(uptime -p)"
echo "Date          : $(date)"

echo "=================================="
