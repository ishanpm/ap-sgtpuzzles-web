import type { GenreKey } from "@/genres"

export interface GameSave {
    id: number,
    filename?: string,
    host?: string,
    port?: number,
    player?: string,
    password?: string,
    baseSeed?: string,
    finished: boolean,
    puzzleData?: PuzzleDataSave[]
    /** @deprecated */
    puzzles?: string[],
    /** @deprecated */
    puzzleSolved?: boolean[]
    /** @deprecated */
    puzzleLocked?: boolean[]
    solveTarget: number
}

export interface PuzzleDataSave {
    genre: GenreKey,
    locked: boolean,
    localSolved: boolean,
    solved: boolean,
    skipped: boolean,
    /** @deprecated */
    index?: number,
    key?: string,
    params?: string,
    id?: string,
    seed?: string,
    items: PuzzlesLocationSave[]
}

export interface PuzzlesLocationSave {
    name: string
    type: string
    itemName?: string
    hint: any
    collected: boolean
}

export interface PuzzleSave {
    gameId: number,
    puzzleId: number,
    data: string
}