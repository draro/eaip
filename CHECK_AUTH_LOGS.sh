#!/bin/bash

echo "Checking authentication logs on VPS..."
echo "========================================"
echo ""

ssh root@72.60.213.232 << 'ENDSSH'
cd /eaip
echo "Last 100 auth-related log lines:"
echo "--------------------------------"
docker-compose logs eaip-app --tail=100 | grep -i -E "(auth|user found|password valid|error|domain login)" | tail -50
ENDSSH
