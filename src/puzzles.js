const {
    Client, ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE, LocationsManager, ReceivedItemsPacket,
    CLIENT_STATUS
} = require("archipelago.js");
const Alpine = require('alpinejs').default;
const SaveData = require("./savedata.js");
const {GameSave, getFile, getFileList, openDatabase} = SaveData;

const genres = [
    "blackbox","bridges","cube","dominosa","fifteen","filling","flip","flood","galaxies",
    "group","guess","inertia","keen","lightup","loopy","magnets","map","mines","mosaic","net",
    "netslide","palisade","pattern","pearl","pegs","range","rect","samegame","signpost",
    "singles","sixteen","slant","solo","tents","towers","tracks","twiddle","undead",
    "unequal","unruly","untangle"
]

document.addEventListener("alpine:init", onInit)

let puzzleframe;
let apReady = false;

/**
 * @type{Client}
 */
let client;

class ArchipelagoPuzzle {
    constructor(options) {
        // Puzzle genre
        this.genre = options.genre;

        // Puzzle generation options (size, difficulty, etc.)
        this.params = options.params;

        // Human-readable puzzle description
        this.desc = "";

        // Puzzle number; also Archipelago region/item number
        this.index = options.index;

        // Puzzle id (params:data)
        this.puzzleId = options.puzzleId;

        // Puzzle seed (genParams#seed)
        this.puzzleSeed = options.puzzleSeed;

        this.solved = options.solved ?? false;
        this.collected = options.collected ?? false;
        this.locked = options.locked ?? false;
        this.item = options.item;
        this.state = "";

        this.updateDescription();
        this.updateState();
    }

    updateDescription() {
        this.desc = `${this.genre}: ${this.params}`;
    }

    updateState() {
        if (this.locked) {
            this.state = "locked";
        } else if (this.solved) {
            this.state = "solved";
        } else {
            this.state = "unlocked";
        }
    }

    onSolve() {
        this.solved = true;
        this.updateState();

        // TODO should probably extract this somewhere
        if (apReady) {
            let locationId = this.index - 1 + 925000;

            client.locations.check(locationId);
        }
    }

    static fromArchipelagoString(genreAndParams, baseSeed, index, options) {
        let seedPrefix = ""+index;
        seedPrefix = seedPrefix.padStart(3, "0");
        let seed = `${seedPrefix}${baseSeed}`;

        let genreParamsMatch = /^([^:]*)(:(.*))?$/.exec(genreAndParams);

        options ??= {};

        options.genre = genreParamsMatch[1];
        options.params = genreParamsMatch[3] ?? "";
        options.puzzleSeed = `${options.params}#${seed}`;
        options.index = index;

        return new ArchipelagoPuzzle(options);
    }

    static fromPuzzlesString(genre, seedOrId, index, options) {
        options ??= {};

        if (seedOrId) {
            let paramsSeparatorMatch = /^([^:#]*)([:#]?)/.exec(seedOrId);

            options.params = paramsSeparatorMatch[1];
            let separator = paramsSeparatorMatch[2];

            if (separator == ":") {
                options.puzzleId = seedOrId;
            } else {
                // also treat string with no separator as seed
                options.puzzleSeed = seedOrId;
            }
        } else {
            options.params = "";
        }

        options.index ??= index;
        options.genre = genre;

        return new ArchipelagoPuzzle(options);
    }
}

function sendMessage(command, ...args) {
    if (puzzleframe) {
        puzzleframe.contentWindow.postMessage([command, ...args])
    }
}

function onInit() {
    console.log("puzzles.html: onInit")

    async function initSaveData() {
        await openDatabase()
        console.log("Savedata open")
        await loadFileList()
        console.log("File list loaded")
    }

    initSaveData();

    initStores()

    // Set up puzzleframe
    puzzleframe = document.getElementById("puzzleframe");

    // puzzleframe will send ["ready"] when initialization is done
}

/**
 * First-time initialization for puzzle data Alpine stores.
 */
function initStores() {
    // List of available puzzles from Archipelago
    Alpine.store("puzzleList", {
        entries: genres.filter(e => e != "group").map((genre,i) => ArchipelagoPuzzle.fromPuzzlesString(genre, "", i+1)),
        sortedEntries: [],
        currentIndex: -1,
        current: null,
        solveCount: 0,
        solveTarget: null,
        finished: false,
        selectPuzzle(entry) {
            if (!entry) {
                this.currentIndex = -1;
                this.current = null;
                return;
            }

            if ((entry.locked && !Alpine.store("debugMode")) || entry.index == this.currentIndex) {
                return;
            }

            this.currentIndex = entry.index;
            this.current = entry;
            if (entry.puzzleId) {
                loadPuzzle(entry.genre, entry.puzzleId, true);
            } else if (entry.puzzleSeed) {
                loadPuzzle(entry.genre, entry.puzzleSeed, true);
            } else {
                loadPuzzle(entry.genre, "", false);
            }
        },
        markSolved() {
            if (this.current) {
                this.current.onSolve();

                const gamesaves = Alpine.store("gamesaves")

                if (this.current.index && gamesaves.current) {
                    savePuzzleData();
                    gamesaves.current.puzzleSolved[this.current.index-1] = true;
                    gamesaves.current.save();
                }

                this.resort();
            }
        },
        resort() {
            // Helper comparison function
            // 0 if a == b; -1 if a < b; 1 if a > b
            // Can be chained with ||
            // Note: this sorts "false" before "true"
            function compare(a,b) {
                if (a < b) return -1;
                else if (a > b) return 1;
                else return 0;
            }

            function sortKey(entry) {
                if (entry.solved) return 1;
                else if (entry.locked) return 2;
                else return 0;
            }

            var sortedEntries = this.entries.slice();
            
            sortedEntries.sort((a,b) => compare(sortKey(a), sortKey(b)))

            this.sortedEntries = sortedEntries;

            this.solveCount = this.entries.reduce((a,b) => (b.solved ? a+1 : a), 0)
        },
        onFinishClick() {
            if (this.solveTarget !== null && this.solveCount >= this.solveTarget) {
                client.updateStatus(CLIENT_STATUS.GOAL);
                this.finished = true;
                Alpine.store("gamesaves").markFinished();
            }
        }
    })

    Alpine.store("puzzleList").resort();

    // Various information about the current puzzle
    Alpine.store("puzzleState", {
        onSolve() {
            this.solved = true;
        },
        undoEnabled: false,
        redoEnabled: false,
        solveEnabled: true,
        primaryKeyLabel: "",
        secondaryKeyLabel: "",
        solved: false,
        status: 0,
        gameId: "",
        gameSeed: "",
        reset() {
            this.solved = false;
            this.undoEnabled = false;
            this.redoEnabled = false;
            this.solveEnabled = true;
            this.primaryKeyLabel = "";
            this.secondaryKeyLabel = "";
            this.status = 0;
            this.gameId = "";
            this.gameSeed = "";
        }
    })

    // A variable to store whether the current puzzle should be played as a fixed puzzle
    // (i.e. disable the Solve button and new game shortcuts)
    Alpine.store("singleMode", false)

    // List of presets for the current puzzle
    // [{id: Int, name: String}]
    Alpine.store("puzzlePresets", [])

    // Dialog box displayed by puzzle midend
    Alpine.store("puzzleDialog", {
        controls: [],
        visible: false,
        addControl(index, type, title, initialValue, choices) {
            if (type == "choice") {
                this.controls.push({index, type, title, value: initialValue, choices})
            } else {
                this.controls.push({index, type, title, value: initialValue})
            }
        },
        confirm: dialogConfirm,
        cancel: dialogCancel,
        dismiss() {
            this.controls = [];
            this.visible = false;
        }
    })

    // Error message displayed by puzzle midend
    Alpine.store("errorMessage", {
        message: "",
        visible: false,
        show(message) {
            this.message = message;
            this.visible = true;
        },
        dismiss() {
            this.visible = false;
        }
    })

    // Puzzle status bar
    Alpine.store("status", {
        message: "",
        visible: false,
        set(value) {
            this.message = value;
            this.visible = true;
        },
        hide() {
            this.message = "";
            this.visible = false;
        }
    })

    // Widget to load puzzles on-demand
    // TODO make this with proper UI
    Alpine.store("debugLoader", {
        genre: "net",
        id: "",
        singleMode: false,
        load() {
            Alpine.store("puzzleList").selectPuzzle(null);
            loadPuzzle(this.genre, this.id, this.singleMode);
        }
    })

    Alpine.store("connectionInfo", {
        hostname: "localhost",
        port: "38281",
        player: "Player1",
        connect() {
            createFile(this.hostname, +this.port, this.player);
        }
    })

    // TODO a lot of this should be moved to connectionInfo (possibly all of it)
    Alpine.store("gamesaves", {
        list: [],
        current: null,
        apError: false,
        connecting: false,
        loadFile(file) {
            loadFile(file);
        },
        deleteFile(file) {
            // TODO proper confirmation dialog
            if (confirm(`${file.toString()}: Delete this file?`)) {
                deleteFile(file)
            }
        },
        markFinished() {
            if (this.current) {
                this.current.finished = true;
                this.current.save();
            }
        }
    })

    Alpine.store("genres", genres)

    resetPuzzleMetadata();
}

/**
 * Reset all puzzle metadata when loading a new puzzle.
 */
function resetPuzzleMetadata() {
    Alpine.store("puzzleState").reset();
    Alpine.store("puzzlePresets", []);
    Alpine.store("puzzleDialog").dismiss();
    Alpine.store("status").hide();
    Alpine.store("errorMessage").dismiss();
}

async function loadPuzzle(genre, id, singleMode) {
    let debugLoader = Alpine.store("debugLoader");

    if (!genre) {
        id = undefined;
        singleMode = true;
    }

    debugLoader.genre = genre;
    debugLoader.id = id;
    debugLoader.singleMode = !!singleMode;

    Alpine.store("singleMode", !!singleMode)

    const puzzleFrameBase = "puzzleframe.html";

    const gamesaves = Alpine.store("gamesaves");

    let hasSave = false;

    if (gamesaves.current && id) {
        let saveData = await gamesaves.current.getPuzzleSave(id);
        if (saveData) {
            hasSave = true;
        }
    }

    let queryFragments = [];

    if (genre) {
        queryFragments.push({key: "g", value: genre});
    }
    // Don't bother sending ID if save data exists
    if (id && !hasSave) {
        queryFragments.push({key: "i", value: id});
    }
    if (singleMode || !genre) {
        queryFragments.push({key: "s", value: "true"});
    }

    let queryString = queryFragments.map(e => `${e.key}=${encodeURIComponent(e.value)}`).join("&");

    puzzleframe.src = null;
    puzzleframe.src = `${puzzleFrameBase}?${queryString}`;
}

async function clearPuzzle() {
    return await loadPuzzle("");
}

//
// puzzleFrame message handlers
//

function onPuzzleFrameLoad() {
    console.log("puzzles.html: puzzleframe ready")
    resetPuzzleMetadata();
}

function js_init_puzzle() {
    
}

function js_post_init() {
    loadPuzzleData();
}

function js_enable_undo_redo(enableUndo, enableRedo) {
    Alpine.store("puzzleState").undoEnabled = !!enableUndo
    Alpine.store("puzzleState").redoEnabled = !!enableRedo
}

function js_remove_solve_button() {
    Alpine.store("puzzleState").solveEnabled = false;
}

function js_update_permalinks(gameId, gameSeed) {
    let puzzleState = Alpine.store("puzzleState");
    puzzleState.gameId = gameId;
    puzzleState.gameSeed = gameSeed;
}

function js_update_status(newStatus) {
    let puzzleState = Alpine.store("puzzleState");
    puzzleState.status = newStatus;
    if (puzzleState.status == 1 && !puzzleState.solved) {
        console.log("woo hoo")
        puzzleState.solved = true
        Alpine.store("puzzleList").markSolved()
    }
}

function js_update_key_labels(pcl, scl) {
    let puzzleState = Alpine.store("puzzleState");
    puzzleState.primaryKeyLabel = pcl;
    puzzleState.secondaryKeyLabel = scl;
}

function js_add_preset(menuId, name, id) {
    let newPreset = {menuId, name, id}
    Alpine.store("puzzlePresets").push(newPreset)
}

function js_add_preset_submenu() {
    // Deal with this later
}

function js_select_preset(id) {
    // idk
}

function js_dialog_init() {
    const dialog = Alpine.store("puzzleDialog");
    dialog.controls = [];
}

function js_dialog_string(index, title, initvalue) {
    Alpine.store("puzzleDialog").addControl(index, "string", title, initvalue)
}

function js_dialog_choices(index, title, choiceStr, initvalue) {
    // Split choiceStr by its first character
    let choices = choiceStr.split(choiceStr[0])
    choices.shift()

    Alpine.store("puzzleDialog").addControl(index, "choice", title, initvalue, choices)
}

function js_dialog_boolean(index, title, initvalue) {
    Alpine.store("puzzleDialog").addControl(index, "boolean", title, !!initvalue)
}

function js_dialog_launch() {
    Alpine.store("puzzleDialog").visible = true;
}

function js_dialog_cleanup() {
    Alpine.store("puzzleDialog").dismiss();
}

function js_canvas_set_statusbar(value) {
    Alpine.store("status").set(value);
}

function js_canvas_remove_statusbar() {
    Alpine.store("status").hide();
}

function js_canvas_set_size(w, h) {

}

function js_focus_canvas() {

}

function js_error_box(message) {
    Alpine.store("errorMessage").show(message)
}

function savePuzzleDataCallback(data) {
    console.log("Save file ready")
    
    const gamesaves = Alpine.store("gamesaves");
    const puzzleList = Alpine.store("puzzleList");
    if (!gamesaves.current || !puzzleList.current) return;

    gamesaves.current.setPuzzleSave(puzzleList.current.index, data)
}

const messageHandlers = {
    ready: onPuzzleFrameLoad, js_init_puzzle, js_post_init,
    js_update_permalinks, js_enable_undo_redo, js_remove_solve_button, js_update_status, js_update_key_labels,
    js_add_preset, js_add_preset_submenu, js_select_preset,
    js_dialog_init, js_dialog_string, js_dialog_choices, js_dialog_boolean, js_dialog_launch, js_dialog_cleanup,
    js_canvas_set_statusbar, js_canvas_remove_statusbar, js_canvas_set_size, js_error_box, js_focus_canvas,
    savePuzzleDataCallback
}

function processMessage(message) {
    if (!message.data[Symbol.iterator]) return;

    let [command, ...args] = message.data

    if (command) {
        let handler = messageHandlers[command]
        if (handler) {
            handler(...args)
        } else {
            console.log("to puzzles.html:", message.data)
            console.warn("No handler found for message", message.data[0])
        }
    }
}

window.onmessage = processMessage

//
// UI functions
//

function showPreferences() {
    sendMessage("showPreferences");
}

function newPuzzle() {
    sendMessage("newPuzzle");
    Alpine.store("puzzleState").solved = false;
}

function restartPuzzle() {
    sendMessage("restartPuzzle");
}

function undoPuzzle() {
    sendMessage("undoPuzzle");
}

function redoPuzzle() {
    sendMessage("redoPuzzle");
}

function solvePuzzle() {
    sendMessage("solvePuzzle");

    // Mark puzzle as solved regardless of whether the puzzle was actually solved

    Alpine.store("puzzleList").markSolved()
}

function setPreset(id) {
    sendMessage("setPreset", id)
}

function dialogConfirm() {
    let dialog = Alpine.store("puzzleDialog");
    for (let elem of dialog.controls) {
        switch (elem.type) {
            case "string":
                sendMessage("dialogReturnString", elem.index, elem.value); break;
            case "choice":
                sendMessage("dialogReturnInt", elem.index, elem.value); break;
            case "boolean":
                sendMessage("dialogReturnInt", elem.index, elem.value ? 1 : 0); break;
        }
    }
    sendMessage("dialogConfirm")
}

function dialogCancel() {
    sendMessage("dialogCancel")
}

function savePuzzleData() {
    sendMessage("savePuzzleData")
}

async function loadPuzzleData() {
    const gamesaves = Alpine.store("gamesaves");
    const puzzleList = Alpine.store("puzzleList");
    if (!gamesaves.current || !puzzleList.current) return;

    let data = await gamesaves.current.getPuzzleSave(puzzleList.current.index);

    if (data) {
        sendMessage("loadPuzzleData", data);
    }
}

function hasItem(itemId) {
    return client.items.received.findIndex(e => e.item == itemId) > -1;
}

function syncAPStatus() {
    const puzzleList = Alpine.store("puzzleList");

    if (!apReady) {
        puzzleList.resort();
        return;
    };

    const gamesaves = Alpine.store("gamesaves");

    let allSolved = true;
    let currentFile = gamesaves.current;

    let fileDirty = false;

    for (let entry of puzzleList.entries) {
        let dirty = false;
        let itemId = entry.index - 1 + 925000;
        let locationId = itemId;

        if (!entry.collected && client.locations.checked.includes(locationId)) {
            entry.collected = true;
            dirty = true;
        } else if (!entry.collected) {
            allSolved = false;
        }

        if (entry.locked && hasItem(itemId)) {
            entry.locked = false;
            dirty = true;

            if (currentFile && currentFile.puzzleLocked[entry.index-1]) {
                currentFile.puzzleLocked[entry.index-1] = false;
                fileDirty = true;
            }
        }

        if (dirty) {
            entry.updateState();
        }
    }

    puzzleList.resort();

    if (fileDirty) {
        currentFile.save();
    }
}

async function createFile(hostname, port, player) {
    const gamesaves = Alpine.store("gamesaves")
    gamesaves.connecting = true;

    disconnectAP();

    gamesaves.apError = false;

    try {
        await connectAP(hostname, port, player);
    } catch (e) {
        alert("Couldn't connect to Archipelago server.");
        console.error("Couldn't connect to Archipelago server");
        console.error(e);

        gamesaves.apError = true;
        gamesaves.connecting = false;

        return;
    }

    let slotData = client.data.slotData;

    let newFile = new GameSave({
        host: hostname,
        port: port,
        player: player,
        puzzles: slotData.puzzles,
        baseSeed: "" + slotData.world_seed,
        solveTarget: slotData.solve_target
    });

    await clearPuzzle();

    loadFileData(newFile);

    await newFile.save();

    apReady = true;
    gamesaves.connecting = false;
    gamesaves.list.push(newFile);
    gamesaves.current = newFile;
    syncAPStatus();
}

/**
 * 
 * @param {SaveData.GameSave} file 
 */
async function loadFile(file) {
    const gamesaves = Alpine.store("gamesaves")
    gamesaves.connecting = true;
    gamesaves.current = file;

    disconnectAP();

    gamesaves.apError = false;
    let connectOk = false;

    if (file.host) {
        try {
            await connectAP(file.host, file.port, file.player);
            connectOk = true;
        } catch (e) {
            alert("Couldn't connect to Archipelago server. (You can still solve unlocked puzzles on this file.)")
            gamesaves.apError = true;
            console.error(e);
        }
    }

    if (connectOk) {
        // Verify puzzle list and seed match
        function anyMismatch() {
            let slotData = client.data.slotData;

            if (file.baseSeed != "" + slotData.world_seed) return true;
            if (file.puzzles.length != slotData.puzzles.length) return true;

            for (let i = 0; i < file.puzzles.length; i++) {
                if (file.puzzles[i] != slotData.puzzles[i]) return true;
            }

            return false;
        }

        if (anyMismatch()) {
            alert("The Archipelago server data doesn't match this save file. (You can still solve unlocked puzzles.)")
            disconnectAP();
            connectOk = false;
            gamesaves.apError = true;
        }
    }

    await clearPuzzle();

    loadFileData(file);

    if (connectOk) {
        apReady = true;
    }

    gamesaves.connecting = false;
    syncAPStatus();
}

async function deleteFile(file) {
    await file.deleteFile();
    
    const gamesaves = Alpine.store("gamesaves");
    const puzzleList = Alpine.store("puzzleList");

    let index = gamesaves.list.indexOf(file);
    if (index > -1) {
        gamesaves.list.splice(index, 1);
    }

    if (gamesaves.current == file) {
        // TODO extract this
        clearPuzzle();
        gamesaves.current = null;
        loadFileData(null);
    }
}

async function loadFileList() {
    const gamesaves = Alpine.store("gamesaves");
    gamesaves.list = await getFileList();

    // let defaultGame = new GameSave({
    //     puzzles: genres.slice()
    // })

    // gamesaves.list.unshift(defaultGame)
}

function onReceiveItems(event) {
    if (apReady) {
        syncAPStatus();
    }
}

function logEvent(event) {
    console.log(event);
}

async function connectAP(hostname, port, player) {
    if (!client) {
        client = new Client();
        window.client = client;
    }

    // TODO probably unnecessary to sync both due to ReceivedItems and RoomUpdate..?
    client.addListener("ReceivedItems", onReceiveItems);
    client.addListener("RoomUpdate", syncAPStatus);
    client.addListener("PacketReceived", logEvent);

    console.log("connecting to AP...");

    const connectionInfo = {
        hostname: hostname,
        port: port,
        game: "Simon Tatham's Portable Puzzle Collection",
        name: player,
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
    };

    await client.connect(connectionInfo);

    console.log("connected to AP");
}

/**
 * 
 * @param {SaveData.GameSave} file
 */
function loadFileData(file) {
    const puzzleList = Alpine.store("puzzleList");

    // TODO styling sometimes doesn't update when reconnecting while a puzzle is selected.
    // Seems like a bug with Alpine (or with how I'm using it), I'll probably have to switch to a different
    // UI/reactivity library
    puzzleList.entries = [];
    puzzleList.sortedEntries = [];
    puzzleList.selectPuzzle(null);
    puzzleList.solveTarget = file?.solveTarget ?? null;
    puzzleList.finished = file.finished;

    if (file) {
        for (let i = 0; i < file.puzzles.length; i++) {
            let options = {locked: file.puzzleLocked[i], solved: file.puzzleSolved[i]}

            let newEntry = ArchipelagoPuzzle.fromArchipelagoString(file.puzzles[i], file.baseSeed, i+1, options)

            puzzleList.entries.push(newEntry);
        }
    }

    puzzleList.resort();
}

function disconnectAP() {
    if (client) {
        apReady = false;
        console.log("disconnecting from AP...");
        client.disconnect();
    }
}

// Expose UI functions to global scope
// I should probably move these to Alpine
window.showPreferences = showPreferences;
window.newPuzzle = newPuzzle;
window.restartPuzzle = restartPuzzle;
window.undoPuzzle = undoPuzzle;
window.redoPuzzle = redoPuzzle;
window.solvePuzzle = solvePuzzle;
window.setPreset = setPreset;
window.savePuzzleData = savePuzzleData;
window.loadPuzzleData = loadPuzzleData;

// Expose some variables to global scope for ease of debugging
window.Alpine = Alpine;
window.store = Alpine.store;
window.client = client;
window.Client = Client;
window.ArchipelagoPuzzle = ArchipelagoPuzzle;
window.syncAPStatus = syncAPStatus;
window.SaveData = SaveData;
window.loadPuzzle = loadPuzzle;

Alpine.start();