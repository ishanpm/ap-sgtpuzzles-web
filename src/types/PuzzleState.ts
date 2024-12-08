import type { GenreKey } from "@/genres";
import type { GenrePresetList } from "./GenrePresetList";

export interface PuzzleState {
    genre: GenreKey
    params?: string
    seed?: string
    id?: string
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