

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
    db?: IDBDatabase

    async openDatabase() {
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
    
        this.db = await asPromise(dbOpenReq);
    }

    async getFileList() {
        if (!this.db) {
            throw Error("SaveService accessed before initialization")
        }

        let transaction = this.db.transaction("gamesave");
        let gamesave = transaction.objectStore("gamesave");

        let fileList = await asPromise(gamesave.getAll());

        //fileList = fileList.map(e => GameSave.fromObject(e));

        return fileList;
    }

    async deleteFile() {
        if (!this.db) {
            throw Error("SaveService accessed before initialization")
        }

        let id = 0; // FIXME

        //if (this.id == -1) return;

        const transaction = this.db.transaction(["gamesave","puzzlesave"], "readwrite");
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

        await Promise.allSettled(toAwait);

        return;
    }
}