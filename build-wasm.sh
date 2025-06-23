#!/bin/sh

echo "Compiling with cmake"
cd ap-sgtpuzzles
set -e
rm -f CMakeCache.txt
emcmake cmake -B build-emscripten -DPUZZLES_ENABLE_UNFINISHED=group .
cd build-emscripten
cmake --build .
cd ../..

echo "Copying resource files"

mkdir -p dist/res
cp -f ap-sgtpuzzles/build-emscripten/*.js dist/res
cp -f ap-sgtpuzzles/build-emscripten/*.wasm dist/res
cp -f ap-sgtpuzzles/build-emscripten/unfinished/*.js dist/res
cp -f ap-sgtpuzzles/build-emscripten/unfinished/*.wasm dist/res
cp -f ap-sgtpuzzles/build-emscripten/xsheep-puzzles/*.js dist/res
cp -f ap-sgtpuzzles/build-emscripten/xsheep-puzzles/*.wasm dist/res

mkdir -p dist/help
cp -rf ap-sgtpuzzles/build-emscripten/help/. dist/help/