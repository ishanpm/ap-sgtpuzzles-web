import type { PuzzleState } from "./PuzzleState"

export class GameModel {
    filename: string
    puzzles: PuzzleState[]
    seed: string

    constructor() {
        this.filename = "";
        this.puzzles = [];
        this.seed = "";
    }
}