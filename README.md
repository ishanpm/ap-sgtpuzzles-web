# Simon Tatham's Portable Puzzle Collection for Archipelago

It's this:

https://www.chiark.greenend.org.uk/~sgtatham/puzzles/

For this:

https://archipelago.gg/

This is a very rough prototype. As such, there are many features missing, the interface is a bit of a mess, it's relatively untested, and absolutely everything is subject to change. If you'd like to report a bug or suggest a feature, feel free to [create an issue here](https://github.com/ishanpm/ap-sgtpuzzles-web/issues).

## Build

I recommend building on Linux. If you're on Windows, you can install WSL to get a Linux-like environment.

First, install these dependencies:
- Node
- Webpack
- CMake
- Emscripten (emcmake)

Then run:

```sh
npm install
./build.sh
```

...and if the stars are aligned correctly it should generate the web files in `/dist`. Serve with the webserver of your choice; I use `python3 -m http.server`.

If you're not running Linux, you can do what the build script does manually:

- Build the JS bundle using `webpack`. This will create a `dist/` folder
- Copy the remaining JS, HTML, and CSS files from `src/` into `dist/`
- Build the `ap-sgtpuzzles/` directory using Emscripten (good luck lol)
- Create a `dist/res/` folder and copy the built `.js` and `.wasm` files there
