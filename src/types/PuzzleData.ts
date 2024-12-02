export class PuzzleData {
    genre: string

    constructor(options: PuzzleDataOptions) {
        this.genre = options.genre;
    }
}

export interface PuzzleDataOptions {
    genre: string,
    solved: boolean,
    params: string,
    id: string | undefined,
    seed: string | undefined,
}