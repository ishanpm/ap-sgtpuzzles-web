import { genres, isGenre, type GenreKey } from "@/genres";
import type { GenrePresetList } from "./GenrePresetList";

export interface PuzzleState {
    genre: GenreKey
    params?: string
    seed?: string
    index?: string
    presets: GenrePresetList
    currentPreset: number

    singleMode: boolean
    status: number
    canSolve: boolean
    canUndo: boolean
    canRedo: boolean
    statusMessage?: string
}

export function newPuzzleState(): PuzzleState {
    return {
        genre: "none",
        presets: {0: {title: "Presets", entries: []}},
        currentPreset: 0,
        singleMode: false,
        status: 0,
        canSolve: true,
        canUndo: false,
        canRedo: false,
    }
}

export function puzzleFromArchipelagoString(genreAndParams: string, baseSeed: string, index: number, options: any) {
    let seedPrefix = ""+index;
    seedPrefix = seedPrefix.padStart(3, "0");
    let seed = `${seedPrefix}${baseSeed}`;

    let genreParamsMatch = /^([^:]*)(:(.*))?$/.exec(genreAndParams);

    if (genreParamsMatch === null) {
        throw new Error(`Couldn't parse puzzle description: ${genreAndParams}`)
    }

    let genreStr = genreParamsMatch[1];

    if (!isGenre(genreStr)) {
        throw new Error("Invalid genre")
    }

    options ??= {};

    options.puzzleSeed = `${options.params}#${seed}`;
    options.index = index;

    let newPuzzle = newPuzzleState();
    newPuzzle.genre = genreStr;
    newPuzzle.params = genreParamsMatch[3] ?? "";
    newPuzzle.seed = `${newPuzzle.params}#${seed}`
    newPuzzle.index = ""+index;

    return newPuzzle;
}