export interface GenrePresetElement {
    type: "preset",
    title: string,
    index: number
}

export interface GenrePresetSubmenuElement {
    type: "submenu",
    title: string,
    index: number
}

export type GenrePresetEntry = GenrePresetElement | GenrePresetSubmenuElement

export type GenrePresetList = {
    [menuId: number]: GenrePresetEntry[]
}
