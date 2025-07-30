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

    async loadGame(id: string): Promise<GameModel | undefined> {
        if (id == "freeplay") {
            this._initFreeplayGame();
            return this.gameModel.value;
        } else if (!isNaN(+id)) {
            let saveNum = +id;
            let result = await this.saveService.getFile(saveNum)
            if (result) {
                this.gameModel.value = result
                return result
            } else {
                return undefined
            }
        }

        return undefined;
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