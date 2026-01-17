#!/bin/bash
set -e

# This script installs Firefox intermediate certificates
# It first checks for pre-downloaded certificates in /tmp/firefox-certs,
# and falls back to downloading if none found

CERTS_SOURCE="/tmp/firefox-certs"
CERTS_DEST="/usr/local/share/ca-certificates/firefox"

# Create destination directory
mkdir -p "$CERTS_DEST"

# Check if pre-downloaded certificates exist
if [ -d "$CERTS_SOURCE" ] && [ -n "$(ls -A $CERTS_SOURCE/*.crt 2>/dev/null)" ]; then
    echo "Found pre-downloaded Firefox intermediate certificates..."

    # Move certificates to destination
    mv "$CERTS_SOURCE"/*.crt "$CERTS_DEST/"

    echo "Moved $(ls -1 $CERTS_DEST/*.crt | wc -l) certificates"
else
    echo "No pre-downloaded certificates found, downloading from Mozilla..."

    # Download certificate list from Firefox settings service
    FILENAMES=$(wget -q -O - https://firefox.settings.services.mozilla.com/v1/buckets/security-state/collections/intermediates/records | jq -r '.data[].attachment.location')

    if [ -z "$FILENAMES" ]; then
        echo "Warning: Failed to fetch certificate list from Firefox settings service"
        exit 0
    fi

    # Download all certificates
    echo "$FILENAMES" | while read -r filename; do
        if [ -n "$filename" ]; then
            url="https://firefox-settings-attachments.cdn.mozilla.net/${filename}"
            cert_filename=$(basename "$filename")
            cert_filename="${cert_filename%.pem}.crt"
            wget -q -O "$CERTS_DEST/${cert_filename}" "$url" || echo "Warning: Failed to download ${filename}"
        fi
    done

    echo "Downloaded $(ls -1 $CERTS_DEST/*.crt 2>/dev/null | wc -l) certificates"
fi

# Set proper permissions
chmod 644 "$CERTS_DEST"/*.crt 2>/dev/null || true
chmod 755 "$CERTS_DEST"

# Update CA certificates
update-ca-certificates

# Cleanup temp directory
rm -rf "$CERTS_SOURCE"

echo "Successfully installed certificates"
