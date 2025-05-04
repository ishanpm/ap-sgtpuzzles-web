import { isGenre, type GenreKey } from "@/genres"

export class PuzzleData {
    genre: GenreKey
    locked: boolean = false
    /** Whether the puzzle has been solved by this client */
    localSolved: boolean = false
    /** Whether the puzzle has been solved by any client */
    solved: boolean = false
    /** Whether this puzzle was skipped to check its locations */
    skipped: boolean = false
    /** Parameter string of the puzzle. This is everything before the hash of the seed, or the colon of the id. */
    params?: string
    /** ID string used to generate the puzzle */
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
    hint: any = "none"
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