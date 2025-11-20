#!/bin/bash

# Pre-pull script for CoreAPI plugin
# Downloads MaxMind GeoLite2 databases required for IP geolocation and ASN lookup
# This script is called by the root pre-pull.sh script

set -e  # Exit on any error

echo "🌍 Starting CoreAPI pre-pull process..."
echo "   Downloading MaxMind GeoLite2 databases for IP geolocation and ASN lookup"

# Get the directory where this script is located (CoreAPI/server)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GEOIP_DB_DIR="$SCRIPT_DIR/api/geoip-db"

# Create geoip-db directory if it doesn't exist
echo "📁 Ensuring geoip-db directory exists..."
mkdir -p "$GEOIP_DB_DIR"

# Function to download a file with error handling
download_file() {
    local url="$1"
    local output_path="$2"
    local filename="$3"

    echo "⬇️  Downloading $filename..."
    echo "   From: $url"
    echo "   To: $output_path"

    if command -v curl >/dev/null 2>&1; then
        # Use curl if available
        if ! curl -L -s -o "$output_path" "$url"; then
            echo "❌ Failed to download $filename using curl"
            return 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        # Use wget if available
        if ! wget -q -O "$output_path" "$url"; then
            echo "❌ Failed to download $filename using wget"
            return 1
        fi
    else
        echo "❌ Neither curl nor wget is available. Please install one of them."
        return 1
    fi

    # Verify the download was successful (check file exists and has size > 0)
    if [ ! -s "$output_path" ]; then
        echo "❌ Downloaded file $filename is empty or missing"
        return 1
    fi

    local file_size=$(stat -c%s "$output_path" 2>/dev/null || stat -f%z "$output_path" 2>/dev/null || echo "unknown")
    echo "✅ Successfully downloaded $filename (${file_size} bytes)"
    return 0
}

# Database download configuration
# Based on the databases array in api/classification/ip-lookup.js
declare -a DATABASE_URLS=(
    "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-Country.mmdb"
    "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-City.mmdb"
    "https://github.com/P3TERX/GeoLite.mmdb/raw/download/GeoLite2-ASN.mmdb"
)

declare -a DATABASE_FILES=(
    "GeoLite2-Country.mmdb"
    "GeoLite2-City.mmdb"
    "GeoLite2-ASN.mmdb"
)

declare -a DATABASE_NAMES=(
    "GeoLite2-Country"
    "GeoLite2-City"
    "GeoLite2-ASN"
)

# Download all databases
DOWNLOAD_SUCCESS=true
for i in "${!DATABASE_URLS[@]}"; do
    url="${DATABASE_URLS[$i]}"
    filename="${DATABASE_FILES[$i]}"
    db_name="${DATABASE_NAMES[$i]}"
    output_path="$GEOIP_DB_DIR/$filename"

    if ! download_file "$url" "$output_path" "$db_name"; then
        DOWNLOAD_SUCCESS=false
    fi
done

if [ "$DOWNLOAD_SUCCESS" = false ]; then
    echo "❌ Some database downloads failed"
    exit 1
fi

# Touch the last-update-check file to indicate databases are current
# This file is checked by ip-lookup.js to determine if databases need updating
LAST_UPDATE_FILE="$GEOIP_DB_DIR/last-update-check"
echo "📅 Creating last-update-check file..."
touch "$LAST_UPDATE_FILE"
echo "✅ Created $LAST_UPDATE_FILE"

# Verify all files exist
echo ""
echo "🔍 Verifying downloaded files..."
MISSING_FILES=false

for i in "${!DATABASE_FILES[@]}"; do
    filename="${DATABASE_FILES[$i]}"
    db_name="${DATABASE_NAMES[$i]}"
    file_path="$GEOIP_DB_DIR/$filename"

    if [ -f "$file_path" ] && [ -s "$file_path" ]; then
        file_size=$(stat -c%s "$file_path" 2>/dev/null || stat -f%z "$file_path" 2>/dev/null || echo "unknown")
        echo "✅ $filename (${file_size} bytes)"
    else
        echo "❌ $filename (missing or empty)"
        MISSING_FILES=true
    fi
done

if [ -f "$LAST_UPDATE_FILE" ]; then
    echo "✅ last-update-check (timestamp file)"
else
    echo "❌ last-update-check (missing)"
    MISSING_FILES=true
fi

if [ "$MISSING_FILES" = true ]; then
    echo "❌ Some files are missing or empty after download"
    exit 1
fi

echo ""
echo "🎉 CoreAPI pre-pull process completed successfully!"
echo "   All MaxMind GeoLite2 databases downloaded to: $GEOIP_DB_DIR"
echo "   Database update timestamp created"
echo ""
echo "📍 Database files:"
echo "   - GeoLite2-Country.mmdb (Country geolocation data)"
echo "   - GeoLite2-City.mmdb (City-level geolocation data)"
echo "   - GeoLite2-ASN.mmdb (Autonomous System Number data)"
echo "   - last-update-check (Update timestamp file)"
