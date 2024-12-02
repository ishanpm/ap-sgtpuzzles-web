# Simon Tatham's Portable Puzzle Collection for Archipelago

It's this:

https://www.chiark.greenend.org.uk/~sgtatham/puzzles/

For this:

https://archipelago.gg/

This is a very rough prototype. As such, there are many features missing, the interface is a bit of a mess, it's relatively untested, and absolutely everything is subject to change. If you'd like to report a bug or suggest a feature, feel free to [create an issue here](https://github.com/ishanpm/ap-sgtpuzzles-web/issues).

## How to play

### Setup

First, download the most recent build of the AP world from the [Releases page](https://github.com/ishanpm/ap-sgtpuzzles-web/releases) and install it 

## Build

I recommend building on Linux. If you're on Windows, you can install WSL to get a Linux-like environment.

First, install these dependencies:
- Node v22.0
- CMake
- Emscripten (emcmake)

Then run:

```sh
npm install
./build-wasm.sh
npm run dev
```

To build for production, run `npm run build` and copy the files from `/dev`.

If you're not running Linux, you can do what the build script does manually:

- Build the `ap-sgtpuzzles/` directory using Emscripten (good luck lol)
- Create the folder `public/res/wasm` folder and copy the built `.js` and `.wasm` files there
- Copy the built `help/` folder to `public/help/`

## License

This project is licensed under the MIT license. See LICENSE for more info.

Additionally, this project uses a fork of Simon Tatham's Portable Puzzle Collection. See https://github.com/ishanpm/ap-sgtpuzzles/blob/main/LICENCE (or LICENCE in the ap-sgtpuzzles submodule) for information about the license and the authors of that project.
