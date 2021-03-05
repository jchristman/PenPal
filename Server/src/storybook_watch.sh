#!/bin/bash

FIND_NODE_MODULES_DIRS="find . -type d -name 'node_modules' -not -path '*/node_modules/*' -and -path '*/plugins/*'"
TRANSFORM_NODE_MODULES_DIRS="DIRS=\$($FIND_NODE_MODULES_DIRS); echo -n \"module.exports = [\"; for dir in \$DIRS; do echo -n \"'\$dir',\"; done; echo -n \"];\""

FIND_JS_FILES="find . -name '*.js' -path '*/client/*' -not \( -path '*/node_modules/*' -or -path '*/.meteor/*' \)"
TRANSFORM_FILES="FILES=\$($FIND_JS_FILES); for file in \$FILES; do echo \"require('.\$file');\"; done"

JS=$(bash -c "$TRANSFORM_FILES")
echo $JS > ./stories/require_all_files.js

JS=$(bash -c "$TRANSFORM_NODE_MODULES_DIRS")
echo $JS > ./.storybook/node_modules.js

while true;
do
    FILE_CHANGE=$(fswatch -1 -r -Ie '.*node_modules.*' --event=Created --event Removed .)
    
    JS=$(bash -c "$TRANSFORM_FILES")
    echo $JS > ./stories/require_all_files.js
done
