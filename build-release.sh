./build-wasm.sh

echo "Running webpack"
webpack --config webpack.prod.js
./copy-web-files.sh