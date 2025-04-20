import { isGenre, type GenreKey } from "@/genres"

export class PuzzleData {
    genre: GenreKey
    locked: boolean = false
    localSolved: boolean = false
    solved: boolean = false
    params?: string
    id?: string
    /** Index of the puzzle in the world */
    index?: number
    /** Seed used to generate the puzzle */
    seed?: string
    items?: PuzzlesLocation[]

    constructor(genre: GenreKey) {
        this.genre = genre
    }
}

export class PuzzlesLocation {
    name: string
    type: string = "unknown"
    itemName?: string
    hint: string = "none"
    collected: boolean = false
    
    constructor(name: string) {
        this.name = name
    }
}

export function puzzleFromArchipelagoString(
        genreAndParams: string,
        baseSeed: string,
        index: number,
        options?: {locked?: boolean, solved?: boolean, items?: PuzzlesLocation[]}) {
    let seedPrefix = ""+index;
    seedPrefix = seedPrefix.padStart(3, "0");
    let seed = `${seedPrefix}${baseSeed}`;

    let genreParamsMatch = /^([^:]*)(:(.*))?$/.exec(genreAndParams);

    if (genreParamsMatch === null) {
        throw new Error(`Couldn't parse puzzle description: ${genreAndParams}`)
    }

    let genre = genreParamsMatch[1];

    if (!isGenre(genre)) {
        throw new Error("Invalid genre")
    }

    options ??= {}

    let newPuzzle = new PuzzleData(genre);
    newPuzzle.index = index;
    newPuzzle.params = genreParamsMatch[3] ?? "";
    newPuzzle.seed = `${newPuzzle.params}#${seed}`
    newPuzzle.locked = options.locked ?? false
    newPuzzle.solved = options.solved ?? false
    newPuzzle.items = options.items

    return newPuzzle;
}