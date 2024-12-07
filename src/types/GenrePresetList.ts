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

export interface GenrePresetMenu {
    title: string,
    entries: GenrePresetEntry[]
}

export type GenrePresetList = {
    [menuId: number]: GenrePresetMenu
}
