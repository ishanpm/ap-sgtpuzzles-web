/**
 * @template T
 * @param {{result: T}} transaction 
 * @returns {Promise<T>}
 */
function asPromise(transaction) {
    return new Promise(function (resolve, reject) {
        transaction.onsuccess(e => resolve(transaction.result));
        transaction.onerror(e => reject(transaction.error));
    })
}

/**
 * @type {IDBDatabase}
 */
let db;

export class GameSave {
    constructor() {
        this.id = 0;
        this.host = "";
        this.port = 0;
        this.player = "";
        this.baseSeed = "";

        /**
         * List of puzzle parameter strings, as provided by the Archipelago world.
         */
        this.puzzleList = [];

        /**
         * List of IDs of puzzle save files.
         */
        this.puzzleSaves = [];
    }

    async save() {
        const transaction = db.transaction("gamesave");
        const gamesave = transaction.objectStore("gamesage");

        return asPromise(gamesave.put(this));
    }

    async getPuzzleSave(id) {
        const transaction = db.transaction("puzzlesave");
        const puzzlesave = transaction.objectStore("puzzlesave");

        return asPromise(puzzlesave.get(id));
    }

    async deleteFile() {
        const transaction = db.transaction(["gamesave","puzzlesave"], "readwrite");
        const gamesave = transaction.objectStore("gamesave");
        const puzzlesave = transaction.objectStore("puzzlesave");

        for (key in this.puzzleSaves) {

        }
    }

    toObject() {

    }

    static fromObject() {

    }
}

export async function openDatabase() {
    let dbOpenReq = indexedDB.open("ap-puzzles", 1);

    dbOpenReq.onupgradeneeded = function(event) {
        let db = dbOpenReq.result;

        if (db.version < 1) {
            db.createObjectStore("gamesave", {autoIncrement: true});
            db.createObjectStore("puzzlesave", {autoIncrement: true});
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