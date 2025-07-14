# Simon Tatham's Portable Puzzle Collection for Archipelago

It's this:

https://www.chiark.greenend.org.uk/~sgtatham/puzzles/

For this:

https://archipelago.gg/

This is a very rough prototype. As such, there are many features missing, the interface is a bit of a mess, it's relatively untested, and absolutely everything is subject to change.

If you'd like to report a bug or suggest a feature, feel free to [create an issue here](https://github.com/ishanpm/ap-sgtpuzzles-web/issues).

If you have other questions or just want to share a neat puzzle you found, come join the [Simon Tatham's Portable Puzzle Collection thread](https://discord.com/channels/731205301247803413/1278733078516207719) in the Archipelago Discord.

## How to play

To try out the puzzles or join an existing multiworld, just head over to [https://ishanpm.github.io/ap-sgtpuzzles](https://ishanpm.github.io/ap-sgtpuzzles)!

If you want to include this game in a multiworld, you can find the YAML template and the apworld in this repository's [releases page](https://github.com/ishanpm/ap-sgtpuzzles-web/releases). See the [Archipelago setup guide](https://archipelago.gg/tutorial/Archipelago/setup/en) for information on how to set up Archipelago and use the apworld.

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

To build for production, run `npm run build` and copy the files from `/dist`.

If you're not running Linux, you can manually build the `ap-sgtpuzzles/` directory using Emscripten into `ap-sgtpuzzles/build-emscripten` instead of running `./build-wasm.sh` (good luck lol).

## License

This project is licensed under the MIT license. See LICENSE for more info.

Additionally, this project uses a fork of Simon Tatham's Portable Puzzle Collection. See https://github.com/ishanpm/ap-sgtpuzzles/blob/main/LICENCE (or LICENCE in the ap-sgtpuzzles submodule) for information about the license and the authors of that project.
