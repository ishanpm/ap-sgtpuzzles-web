#!/bin/sh

webpack

echo "Copying static files"
mkdir -p dist
cp -f src/puzzleframe.html src/puzzleframe.js src/puzzles.css src/puzzles.html dist