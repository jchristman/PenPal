#!/bin/bash

set -e

echo "🔄 Ensuring MongoDB is running..."

# Check if the MongoDB container is running
if ! docker ps --format "table {{.Names}}" | grep -q "^penpal-mongo$"; then
    echo "📦 MongoDB container not running. Starting it..."

    # Start just the MongoDB service using the datastore compose file
    docker compose -f Plugins/DataStoreMongoAdapter/server/docker-compose.datastore-mongo-adapter.yaml up -d penpal_mongo

    # Wait for MongoDB to be ready
    echo "⏳ Waiting for MongoDB to be ready..."
    for i in {1..30}; do
        if docker exec penpal-mongo mongosh --eval "db.adminCommand('ping')" --quiet >/dev/null 2>&1; then
            echo "✅ MongoDB is ready!"
            break
        fi
        echo "   Attempt $i/30: MongoDB not ready yet..."
        sleep 2
    done

    if [ $i -eq 30 ]; then
        echo "❌ Failed to start MongoDB after 60 seconds"
        exit 1
    fi
else
    echo "✅ MongoDB container is already running"
fi

echo "🗑️  Clearing MongoDB database..."

# Connect to MongoDB and clear all databases
# We'll use mongosh to execute commands directly on the PenPal database
docker exec penpal-mongo mongosh PenPal --eval "
print('📋 Listing current collections...');
const collections = db.getCollectionNames();
print('Found collections:', collections.join(', '));

print('🗑️  Dropping all collections...');
collections.forEach(function(collection) {
    print('Dropping collection:', collection);
    db[collection].drop();
});

print('✅ All collections dropped successfully!');
print('✅ Database cleared!');
"

if [ $? -eq 0 ]; then
    echo "✅ Database cleared successfully!"
    echo ""
    echo "💡 To stop the MongoDB container when done:"
    echo "   docker compose -f Plugins/DataStoreMongoAdapter/server/docker-compose.datastore-mongo-adapter.yaml down"
else
    echo "❌ Failed to clear database"
    exit 1
fi
