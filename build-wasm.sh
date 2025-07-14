#!/bin/sh

echo "Compiling with cmake"
cd ap-sgtpuzzles
set -e
rm -f CMakeCache.txt
emcmake cmake -B build-emscripten -DPUZZLES_ENABLE_UNFINISHED=group -DHTML_BUILD_MODE=archipelago .
cd build-emscripten
cmake --build .
