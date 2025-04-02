import type { JSONSerializableData, SlotData } from "archipelago.js"

export interface APSlotData {
    "world_seed": number
    "seed_name": string
    "player_name": string,
    "player_id": number,
    "client_version": number,
    "world_version": string,
    "race": boolean,
    "puzzles": string[],
    "solve_target": number
}

export function isAPSlotData(obj?: any): obj is APSlotData {
    if (typeof obj != "object") return false;
    if (typeof obj.world_seed != "number") return false;
    if (typeof obj.seed_name != "string") return false;
    if (typeof obj.player_name != "string") return false;
    if (typeof obj.player_id != "number") return false;
    if (typeof obj.client_version != "number") return false;
    if (typeof obj.race != "boolean") return false;
    if (!Array.isArray(obj.puzzles)) return false;
    for (let puzzle of obj.puzzles) {
        if (typeof puzzle != "string") return false;
    }
    if (typeof obj.solve_target != "number") return false;

    return true
}