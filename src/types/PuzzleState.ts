import { genres, isGenre, type GenreKey } from "@/genres";
import type { GenrePresetList } from "./GenrePresetList";

export class PuzzleState {
    genre: GenreKey
    params?: string
    seed?: string
    presets: GenrePresetList
    currentPreset: number

    singleMode: boolean
    status: number
    canSolve: boolean
    canUndo: boolean
    canRedo: boolean
    statusMessage?: string

    constructor() {
        this.genre = "none"
        this.presets = {0: {title: "Presets", entries: []}}
        this.currentPreset = 0
        this.singleMode = false
        this.status = 0
        this.canSolve = true
        this.canUndo = false
        this.canRedo = false
    }
}