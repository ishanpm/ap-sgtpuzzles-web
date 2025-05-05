import { genreInfo, genres, type GenreKey } from "@/genres"
import { PuzzleData } from "./PuzzleData"

export class GameModel {
    filename?: string = ""
    host?: string
    port?: number
    player?: string
    password?: string

    puzzles: PuzzleData[] = []
    seed: string = ""
    freeplay: boolean = false
}

export function getFreeplayGame(includeHidden: boolean = false) {
    let game = new GameModel()

    game.filename = "Freeplay"
    game.freeplay = true

    let filteredGenres: readonly GenreKey[] = genres;
    if (!includeHidden) {
        filteredGenres = filteredGenres.filter(g => !genreInfo[g].hidden)
    }

    game.puzzles = filteredGenres.map(g => {
        let newPuzzle = new PuzzleData(g)
        return newPuzzle
    })
}