#!/bin/bash

echo "🧹 Cleaning up zombie Docker processes..."

# Get the PenPal server container ID
CONTAINER_ID=$(docker ps --filter "name=penpal-server" --format "{{.ID}}" | head -1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Could not find penpal-server container"
    exit 1
fi

echo "📦 Found PenPal server container: $CONTAINER_ID"

# Count zombie processes before cleanup
ZOMBIE_COUNT_BEFORE=$(docker exec $CONTAINER_ID ps aux | grep -E "(docker.*wait|docker.*attach|<defunct>)" | grep -v grep | wc -l)
echo "🧟 Zombie processes before cleanup: $ZOMBIE_COUNT_BEFORE"

if [ "$ZOMBIE_COUNT_BEFORE" -gt 0 ]; then
    echo "🔍 Zombie processes found:"
    docker exec $CONTAINER_ID ps aux | grep -E "(docker.*wait|docker.*attach|<defunct>)" | grep -v grep | head -10
    
    echo ""
    echo "💀 Killing zombie docker processes..."
    
    # Kill docker wait processes
    docker exec $CONTAINER_ID pkill -f "docker.*wait" 2>/dev/null || true
    
    # Kill docker attach processes  
    docker exec $CONTAINER_ID pkill -f "docker.*attach" 2>/dev/null || true
    
    # Kill any remaining defunct processes (zombies)
    docker exec $CONTAINER_ID ps aux | grep "<defunct>" | awk '{print $2}' | xargs -r docker exec $CONTAINER_ID kill -9 2>/dev/null || true
    
    sleep 2
    
    # Count after cleanup
    ZOMBIE_COUNT_AFTER=$(docker exec $CONTAINER_ID ps aux | grep -E "(docker.*wait|docker.*attach|<defunct>)" | grep -v grep | wc -l)
    echo "✅ Zombie processes after cleanup: $ZOMBIE_COUNT_AFTER"
    
    if [ "$ZOMBIE_COUNT_AFTER" -lt "$ZOMBIE_COUNT_BEFORE" ]; then
        echo "🎉 Successfully cleaned up $((ZOMBIE_COUNT_BEFORE - ZOMBIE_COUNT_AFTER)) zombie processes"
    else
        echo "⚠️  No processes were cleaned up (they may have been cleaned automatically)"
    fi
else
    echo "✅ No zombie processes found"
fi

echo ""
echo "📊 Current process summary:"
docker exec $CONTAINER_ID ps aux | head -1  # Header
docker exec $CONTAINER_ID ps aux | grep -E "(bun|node|docker)" | grep -v grep | head -10

echo ""
echo "🔍 Memory usage:"
docker exec $CONTAINER_ID cat /proc/\$(pgrep -o bun || pgrep -o node)/status | grep -E "(VmRSS|VmSize|VmData|VmStk)"

echo ""
echo "✅ Cleanup complete!" 