import { GameModel } from "@/types/GameModel";
import type { GameSave, PuzzleDataSave, PuzzleSave, PuzzlesLocationSave } from "@/types/GameSave";
import { PuzzleData, puzzleFromArchipelagoString, PuzzlesLocation } from "@/types/PuzzleData";
import type { InjectionKey } from "vue";

export const saveServiceKey = Symbol() as InjectionKey<SaveService>

/**
 * Helper function to turn an IDBRequest into a Promise, for use with async/await.
 */
function asPromise<T>(transaction: IDBRequest<T>): Promise<T> {
    return new Promise(function (resolve, reject) {
        transaction.onsuccess = (_ => resolve(transaction.result));
        transaction.onerror = (_ => reject(transaction.error));
    })
}

/**
 * Helper function to turn an IDBCursor-returning IDBRequest into an async generator,
 * for use with a "for await" statement.
 */
async function* asIterator<T extends IDBCursor>(transaction: IDBRequest<T|null>) {
    let cursor: T|null;
    do {
        cursor = await asPromise(transaction);

        if (cursor) {
            yield cursor;

            cursor.continue();
        }
    } while (cursor)
}

export class SaveService { 
    db: Promise<IDBDatabase>

    constructor() {
        this.db = new Promise((resolve, reject) => {
            this.openDatabase(resolve)
        })
    }

    async openDatabase(dbResolveCallback: (db: PromiseLike<IDBDatabase>) => void) {
        let dbOpenReq = indexedDB.open("ap-puzzles", 1);
    
        dbOpenReq.onupgradeneeded = function(event) {
            let db = dbOpenReq.result;
    
            console.log("Creating indexedDB stores")
    
            if (event.oldVersion < 1) {
                let gamesave = db.createObjectStore("gamesave", {keyPath: "id", autoIncrement: true});
                let puzzlesave = db.createObjectStore("puzzlesave", {keyPath: ["gameId","puzzleId"]});
    
                puzzlesave.createIndex("gameId", "gameId")
            }
        };
    
        dbResolveCallback(asPromise(dbOpenReq));
    }

    async getFileList() {
        let db = await this.db;

        let transaction = db.transaction("gamesave");
        let gamesave = transaction.objectStore("gamesave");

        let fileList = await asPromise<GameSave[]>(gamesave.getAll());

        let gameModels: {[id: number]: GameModel} = {}
        
        for (let file of fileList) {
            gameModels[file.id] = this._inflateGameModel(file)
        }

        return gameModels;
    }

    async getFile(id: number) {
        let db = await this.db;

        let transaction = db.transaction("gamesave");
        let gamesave = transaction.objectStore("gamesave");

        let file = await asPromise<GameSave | undefined>(gamesave.get(id))

        if (!file) {
            return undefined
        }

        let gameModel = this._inflateGameModel(file)

        return gameModel;
    }

    async deleteFile(id: number) {
        let db = await this.db;

        if (id == -1) return;

        const transaction = db.transaction(["gamesave","puzzlesave"], "readwrite");
        const gamesave = transaction.objectStore("gamesave");
        const puzzlesave = transaction.objectStore("puzzlesave");

        let toAwait: Promise<void>[] = [];

        const puzzlesByGameId = puzzlesave.index("gameId")

        let puzzleIterator = asIterator(puzzlesByGameId.openCursor(id))

        for await (let cursor of puzzleIterator) {
            toAwait.push(asPromise(cursor.delete()));
        }

        toAwait.push(asPromise(gamesave.delete(id)));

        transaction.commit();

        await Promise.allSettled(toAwait)
    }

    async savePuzzleData(file: number, index: number, data: string) {
        let db = await this.db;

        const transaction = db.transaction("puzzlesave")
        const puzzlesave = transaction.objectStore("puzzlesave")

        let save = {
            file,
            index,
            data
        }

        await asPromise(puzzlesave.put(save))
    }

    async loadPuzzleData(file: number, index: number): Promise<string | null> {
        let db = await this.db;

        const transaction = db.transaction("puzzlesave")
        const puzzlesave = transaction.objectStore("puzzlesave")

        let save = await asPromise<PuzzleSave | undefined>(puzzlesave.get([file, index]))

        return save?.data ?? null
    }

    _inflateGameModel(save: GameSave): GameModel {
        let ret = new GameModel()
        ret.freeplay = false
        ret.host = save.host
        ret.port = save.port
        ret.password = save.password
        ret.player = save.player
        ret.filename = save.filename ?? save.player
        ret.seed = save.baseSeed ?? ""

        if (save.puzzleData) {
            ret.puzzles = save.puzzleData.map(this._inflatePuzzleData)
        } else if (save.puzzles && save.puzzleLocked && save.puzzleSolved && save.baseSeed) {
            // Load old version save files
            for (let i = 0; i < save.puzzleSolved.length; i++) {
                let newPuzzle = puzzleFromArchipelagoString(save.puzzles[i], save.baseSeed, i+1)
                newPuzzle.locked = save.puzzleLocked[i]
                newPuzzle.solved = newPuzzle.localSolved = save.puzzleSolved[i]
                ret.puzzles.push(newPuzzle)
            }
        }

        return ret
    }

    _deflateGameModel(game: GameModel): GameSave {
        return {
            finished: false, //TODO
            id: 9999999, //TODO
            puzzleData: game.puzzles.map(this._deflatePuzzleData),
            solveTarget: game.puzzles.length, //TODO
            baseSeed: game.seed,
            filename: game.filename,
            host: "", //TODO
            player: "", //TODO
            password: "", //TODO
            port: 0 //TODO
        }
    }

    _inflatePuzzleData(save: PuzzleDataSave): PuzzleData {
        let ret = new PuzzleData(save.genre)
        ret.key = save.key ?? (""+save.index)
        ret.locked = save.locked
        ret.localSolved = save.localSolved
        ret.solved = save.solved
        ret.skipped = save.skipped
        ret.params = save.params
        ret.id = save.id
        ret.seed = save.seed
        ret.items = save.items.map(this._inflatePuzzleLocation)

        return ret
    }

    _deflatePuzzleData(puzzle: PuzzleData): PuzzleDataSave {
        return {
            genre: puzzle.genre,
            key: puzzle.key ?? "",
            items: puzzle.items?.map(this._deflatePuzzleLocation) ?? [],
            localSolved: puzzle.localSolved,
            solved: puzzle.solved,
            locked: puzzle.locked,
            skipped: puzzle.skipped,
            params: puzzle.params,
            id: puzzle.id,
            seed: puzzle.seed
        }
    }

    _inflatePuzzleLocation(save: PuzzlesLocationSave): PuzzlesLocation {
        let ret = new PuzzlesLocation(save.name)
        ret.collected = save.collected
        ret.hint = save.hint
        ret.itemName = save.itemName
        ret.type = save.type

        return ret
    }

    _deflatePuzzleLocation(location: PuzzlesLocation): PuzzlesLocationSave {
        return {
            collected: location.collected,
            hint: location.hint,
            name: location.name,
            type: location.type,
            itemName: location.itemName
        }
    }
}