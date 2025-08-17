import { GameModel } from "@/types/GameModel";
import { ref, type InjectionKey, type Ref } from "vue";
import type { PuzzlesAPConnection } from "./PuzzlesAPConnection";
import type { SaveService } from "./SaveService";
import { genres } from "@/genres";
import { PuzzleData } from "@/types/PuzzleData";

export const gameServiceKey = Symbol() as InjectionKey<GameService>

export class GameService {
    apConnection: PuzzlesAPConnection
    saveService: SaveService
    gameModel: Ref<GameModel>

    constructor(apConnection: PuzzlesAPConnection, saveService: SaveService) {
        this.apConnection = apConnection;
        this.saveService = saveService;
        this.gameModel = ref<GameModel>(new GameModel());
    }

    async newGame(host: string, port: number, player: string, password: string | undefined): Promise<GameModel> {
        let model = await this.apConnection.connectAP(host, port, player, password)

        return model;
    }

    async loadGame(id: string): Promise<GameConnectionResult> {
        if (id == "freeplay") {
            this._initFreeplayGame();
            return {gameModel: this.gameModel};
        } else if (!isNaN(+id)) {
            let saveNum = +id;
            let save = await this.saveService.getFile(saveNum)
            let error: any = undefined
            
            if (save) {
                this.gameModel.value = save

                if (save.host && save.port && save.player) {
                    try {
                        // Skip connecting if already connected
                        if (this.apConnection.model.value.fileId != save.fileId) {
                            console.log("Connecting to AP...")
                            let remoteSlotData = await this.apConnection.connectAP(save.host, save.port, save.player, save.password)
                            // TODO compare remote and local slot data
                        }
                        this.apConnection.setModel(this.gameModel.value)
                    } catch (e) {
                        console.error(e)
                        error = e
                    }
                }

                return {gameModel: this.gameModel, error}
            } else {
                return {error: "Couldn't load save file"}
            }
        }

        return {error: "Invalid file ID"};
    }

    markPuzzleSolved(key: string) {

    }

    _initFreeplayGame() {
        let puzzles = genres.map(g => {
            let puzzle = new PuzzleData(g)
            puzzle.key = g
            return puzzle
        })

        let gameModel = new GameModel()
        gameModel.freeplay = true
        gameModel.filename = "Freeplay"
        gameModel.puzzles = puzzles

        this.gameModel.value = gameModel
    }
}

export interface GameConnectionResult {
    gameModel?: Ref<GameModel>
    error?: any
}