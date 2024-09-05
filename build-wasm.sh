#!/bin/sh

echo "Compiling with cmake"
cd ap-sgtpuzzles
set -e
rm -f CMakeCache.txt
emcmake cmake -B build-emscripten .
cd build-emscripten
cmake --build .
cd ../..

echo "Copying resource files"

mkdir -p dist/res
cp -f ap-sgtpuzzles/build-emscripten/*.js dist/res
cp -f ap-sgtpuzzles/build-emscripten/*.wasm dist/res
