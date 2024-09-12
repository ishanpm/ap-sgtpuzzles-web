#!/bin/sh

echo "Running webpack"
webpack --config webpack.dev.js
./copy-web-files.sh