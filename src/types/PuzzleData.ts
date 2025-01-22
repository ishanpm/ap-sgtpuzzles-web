import { isGenre, type GenreKey } from "@/genres"

export class PuzzleData {
    genre: GenreKey
    solved: boolean
    params?: string
    id?: string
    seed?: string

    constructor(genre: GenreKey) {
        this.genre = genre
        this.solved = false
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

    let genre = genreParamsMatch[1];

    if (!isGenre(genre)) {
        throw new Error("Invalid genre")
    }

    options ??= {};

    options.puzzleSeed = `${options.params}#${seed}`;
    options.index = index;

    let newPuzzle = new PuzzleData(genre);
    newPuzzle.genre = genre;
    newPuzzle.params = genreParamsMatch[3] ?? "";
    newPuzzle.seed = `${newPuzzle.params}#${seed}`

    return newPuzzle;
}