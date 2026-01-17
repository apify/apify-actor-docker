#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="${SCRIPT_DIR}/certs"
ZIP_FILE="${SCRIPT_DIR}/firefox-certificates.zip"

echo "Downloading Firefox intermediate certificates..."

# Create certs directory if it doesn't exist
mkdir -p "${CERTS_DIR}"

# Remove existing certificates
rm -f "${CERTS_DIR}"/*.crt 2>/dev/null || true
echo "Cleared existing certificates"

# Get the list of certificate attachment locations from Firefox settings service
FILENAMES=$(wget -q -O - https://firefox.settings.services.mozilla.com/v1/buckets/security-state/collections/intermediates/records | jq -r '.data[].attachment.location')

if [ -z "$FILENAMES" ]; then
    echo "Error: Failed to fetch certificate list from Firefox settings service"
    exit 1
fi

# Count total certificates
TOTAL=$(echo "$FILENAMES" | wc -l)
echo "Found ${TOTAL} certificates to download"

# Download all certificates
echo "$FILENAMES" | while read -r filename; do
    if [ -n "$filename" ]; then
        url="https://firefox-settings-attachments.cdn.mozilla.net/${filename}"
        # Extract just the filename from the path
        cert_filename=$(basename "$filename")
        # Change extension from .pem to .crt
        cert_filename="${cert_filename%.pem}.crt"

        if wget -q -O "${CERTS_DIR}/${cert_filename}" "$url"; then
            echo "Downloaded ${cert_filename}"
        else
            echo "Warning: Failed to download ${filename}"
        fi
    fi
done

# Set proper permissions
chmod 644 "${CERTS_DIR}"/*.crt 2>/dev/null || true
chmod 755 "${CERTS_DIR}"

# Count downloaded certificates
DOWNLOADED=$(ls -1 "${CERTS_DIR}"/*.crt 2>/dev/null | wc -l)
echo "Successfully downloaded ${DOWNLOADED} certificates to ${CERTS_DIR}"

# Create zip archive of all certificates
echo "Creating zip archive..."
rm -f "${ZIP_FILE}" 2>/dev/null || true
cd "${CERTS_DIR}" && zip -q "${ZIP_FILE}" *.crt
echo "Created ${ZIP_FILE} with ${DOWNLOADED} certificates"

# Clean up individual certificate files (they're now in the zip)
rm -f "${CERTS_DIR}"/*.crt 2>/dev/null || true
echo "Cleaned up individual certificate files"
