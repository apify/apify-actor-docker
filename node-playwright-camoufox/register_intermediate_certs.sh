#!/bin/bash

FILENAMES=$(wget -O - https://firefox.settings.services.mozilla.com/v1/buckets/security-state/collections/intermediates/records | jq -r '.data[].attachment.location')

mkdir -p /usr/local/share/ca-certificates/firefox

wget -P "/usr/local/share/ca-certificates/firefox/" -i <(echo $FILENAMES | tr ' ' '\n' | sed -e 's/^/https:\/\/firefox-settings-attachments.cdn.mozilla.net\//g')

for f in /usr/local/share/ca-certificates/firefox/*.pem; do
    mv -- "$f" "${f%.pem}.crt"
done

chmod 644 /usr/local/share/ca-certificates/firefox/*.crt
chmod 755 /usr/local/share/ca-certificates/firefox

update-ca-certificates