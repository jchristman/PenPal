#!/bin/bash

cd /n8n/packages/nodes-base/nodes

# Exit if the directory isn't found.
if (($?>0)); then
    echo "Can't find work dir... exiting"
    exit
fi

for i in *; do
    if ! grep -qxFe "$i" /tmp/node-whitelist.txt; then
        echo "Removing built-in n8n integration: $i"
        cat ../package.json | egrep -v `echo $i | sed -e 's/\.ts/.js/g'` > ../package.json.bak
        mv ../package.json.bak ../package.json
        rm -rf "$i"
    fi
done

rm /tmp/*node*
