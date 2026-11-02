
#!/bin/bash

echo "=================================="
echo "       DISK MONITORING SYSTEM"
echo "=================================="

df -h --output=source,size,used,avail,pcent,target -x tmpfs -x devtmpfs

echo "=================================="
