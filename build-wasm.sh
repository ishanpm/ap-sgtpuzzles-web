#!/bin/sh

echo "Compiling with cmake"
cd ap-sgtpuzzles
set -e
rm -f CMakeCache.txt
emcmake cmake -B build-emscripten -DPUZZLES_ENABLE_UNFINISHED=group -DHTML_BUILD_MODE=archipelago .
cd build-emscripten
cmake --build .
cd ../..

echo "Copying resource files"

mkdir -p public/res/wasm
cp -f ap-sgtpuzzles/build-emscripten/*.js public/res/wasm
cp -f ap-sgtpuzzles/build-emscripten/*.wasm public/res/wasm
cp -f ap-sgtpuzzles/build-emscripten/unfinished/*.js public/res/wasm
cp -f ap-sgtpuzzles/build-emscripten/unfinished/*.wasm public/res/wasm
cp -f ap-sgtpuzzles/build-emscripten/xsheep-puzzles/*.js public/res/wasm
cp -f ap-sgtpuzzles/build-emscripten/xsheep-puzzles/*.wasm public/res/wasm

mkdir -p public/help
cp -rf ap-sgtpuzzles/build-emscripten/help/. public/help/