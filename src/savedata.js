/**
 * @template T
 * @param {{result: T}} transaction 
 * @returns {Promise<T>}
 */
function asPromise(transaction) {
    return new Promise(function (resolve, reject) {
        transaction.onsuccess = (e => resolve(transaction.result));
        transaction.onerror = (e => reject(transaction.error));
    })
}

/**
 * template T
 * @param {IDBRequest<IDBCursor | null>} transaction
 */
async function* asIterator(transaction) {
    let cursor;
    do {
        cursor = await asPromise(transaction);

        if (cursor) {
            yield cursor;

            cursor.continue();
        }
    } while (cursor)
}

/**
 * @type {IDBDatabase}
 */
let db;

export class GameSave {
    constructor(options) {
        options ??= {};

        this.id = options.id ?? null;
        this.host = options.host ?? "";
        this.port = options.port ?? 0;
        this.player = options.player ?? "";
        this.baseSeed = "" + (options.baseSeed ?? "");

        this.solveTarget = options.solveTarget ?? null;

        /**
         * List of puzzle parameter strings, as provided by the Archipelago world.
         * @type {string[]}
         */
        this.puzzles = options.puzzles ?? [];

        /**
         * Solved status of puzzles.
         * @type {boolean[]}
         */
        this.puzzleSolved = options.puzzleSolved ?? Array(this.puzzles.length).fill(false)

        /**
         * Locked status of puzzles.
         * @type {boolean[]}
         */
        this.puzzleLocked = options.puzzleLocked ?? Array(this.puzzles.length).fill(true)
    }

    async save() {
        if (this.id == -1) return;

        const transaction = db.transaction("gamesave", "readwrite");
        const gamesave = transaction.objectStore("gamesave");

        let obj = this.toObject();
        if (obj.id === null) {
            delete obj.id;
        }

        let key = await asPromise(gamesave.put(obj));

        if (this.id === null) {
            this.id = key
        }

        transaction.commit();
    }

    async getPuzzleSave(puzzleId) {
        if (this.id == -1) return;

        const transaction = db.transaction("puzzlesave");
        const puzzlesave = transaction.objectStore("puzzlesave");

        let obj = await asPromise(puzzlesave.get([this.id, puzzleId]));

        if (obj) {
            return obj.data;
        } else {
            return null;
        }
    }

    async setPuzzleSave(puzzleId, data) {
        if (this.id == -1) return;

        const transaction = db.transaction("puzzlesave", "readwrite");
        const puzzlesave = transaction.objectStore("puzzlesave");

        let obj = {gameId: this.id, puzzleId: puzzleId, data: data};

        await asPromise(puzzlesave.put(obj));

        return;
    }

    async deleteFile() {
        if (this.id == -1) return;

        const transaction = db.transaction(["gamesave","puzzlesave"], "readwrite");
        const gamesave = transaction.objectStore("gamesave");
        const puzzlesave = transaction.objectStore("puzzlesave");

        let toAwait = [];

        const puzzlesByGameId = puzzlesave.index("gameId")

        let puzzleIterator = asIterator(puzzlesByGameId.openCursor(this.id))

        for await (let cursor of puzzleIterator) {
            toAwait.push(cursor.delete());
        }

        toAwait.push(asPromise(gamesave.delete(this.id)));

        transaction.commit();

        await Promise.allSettled(toAwait);

        return;
    }

    toString() {
        return `${this.player} (${this.host}:${this.port}), ${this.puzzles.length} puzzles`;
    }

    toObject() {
        return {
            id: this.id,
            host: this.host,
            port: this.port,
            player: this.player,
            baseSeed: this.baseSeed,
            puzzles: this.puzzles.slice(),
            puzzleSolved: this.puzzleSolved.slice(),
            puzzleLocked: this.puzzleLocked.slice(),
            solveTarget: this.solveTarget
        };
    }

    static fromObject(obj) {
        return new GameSave(obj);
    }
}

export async function openDatabase() {
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

    db = await asPromise(dbOpenReq);
}

export async function getFileList() {
    let transaction = db.transaction("gamesave");
    let gamesave = transaction.objectStore("gamesave");

    let fileList = await asPromise(gamesave.getAll());

    fileList = fileList.map(e => GameSave.fromObject(e));

    return fileList;
}

export async function getFile(id) {
    return new GameSave.fromObject();
}