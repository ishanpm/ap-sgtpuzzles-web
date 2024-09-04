const {
    Client, ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE, LocationsManager, ReceivedItemsPacket,
    CLIENT_STATUS,
    
} = require("archipelago.js");
const Alpine = require('alpinejs').default;

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

        let genreParamsMatch = /^([^:]*):(.*)$/.exec(genreAndParams);

        options ??= {};

        options.genre = genreParamsMatch[1];
        options.params = genreParamsMatch[2];
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
        entries: [
            ArchipelagoPuzzle.fromPuzzlesString("loopy", "7x7e#123", 1, {locked: true}),
            ArchipelagoPuzzle.fromPuzzlesString("net", "5x5#123", 2),
            ArchipelagoPuzzle.fromPuzzlesString("net", "2x2#456", 3),
            ArchipelagoPuzzle.fromPuzzlesString("fifteen", "2x2#123", 4),
            ArchipelagoPuzzle.fromPuzzlesString("loopy", "", 5)
        ],
        currentIndex: -1,
        current: null,
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
            }
        }
    })

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
            connectAP(this.hostname, +this.port, this.player);
        }
    })

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

function loadPuzzle(genre, id, singleMode) {
    let debugLoader = Alpine.store("debugLoader");
    debugLoader.genre = genre;
    debugLoader.id = id;
    debugLoader.singleMode = !!singleMode;

    Alpine.store("singleMode", !!singleMode)

    const puzzleFrameBase = "puzzleframe.html";
    let queryFragments = [{key: "g", value: genre}];
    if (id) {
        queryFragments.push({key: "i", value: id});
    }
    if (singleMode) {
        queryFragments.push({key: "s", value: "true"});
    }

    let queryString = queryFragments.map(e => `${e.key}=${encodeURIComponent(e.value)}`).join("&");

    puzzleframe.src = null;
    puzzleframe.src = `${puzzleFrameBase}?${queryString}`;
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
    choices = choiceStr.split(choiceStr[0])
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

const messageHandlers = {
    ready: onPuzzleFrameLoad, js_init_puzzle, js_post_init,
    js_update_permalinks, js_enable_undo_redo, js_remove_solve_button, js_update_status, js_update_key_labels,
    js_add_preset, js_add_preset_submenu, js_select_preset,
    js_dialog_init, js_dialog_string, js_dialog_choices, js_dialog_boolean, js_dialog_launch, js_dialog_cleanup,
    js_canvas_set_statusbar, js_canvas_remove_statusbar, js_canvas_set_size, js_error_box, js_focus_canvas
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

function onReceiveItems(event) {
    if (apReady) {
        syncAPStatus();
    }
}

function logEvent(event) {
    console.log(event);
}

function hasItem(itemId) {
    return client.items.received.findIndex(e => e.item == itemId) > -1;
}

function syncAPStatus() {
    if (!apReady) return;

    const puzzleList = Alpine.store("puzzleList");

    let allSolved = true;

    for (let entry of puzzleList.entries) {
        let dirty = false;
        let itemId = entry.index - 1 + 925000;
        let locationId = itemId;

        // TODO distinguish solved from collected
        if (!entry.solved && client.locations.checked.includes(locationId)) {
            entry.solved = true;
            dirty = true;
        } else if (!entry.solved) {
            allSolved = false;
        }

        if (entry.locked && hasItem(itemId)) {
            entry.locked = false;
            dirty = true;
        }

        if (dirty) {
            entry.updateState();
        }
    }

    if (allSolved) {
        client.updateStatus(CLIENT_STATUS.GOAL);
    }
}

async function connectAP(hostname, port, player) {
    if (client) {
        apReady = false;
        console.log("disconnecting from AP...");
        await client.disconnect();
    } else {
        client = new Client();
        window.client = client;
    }

    // TODO probably unnecessary to sync both due to ReceivedItems and RoomUpdate..?
    client.addListener("ReceivedItems", onReceiveItems)
    client.addListener("RoomUpdate", syncAPStatus)
    client.addListener("PacketReceived", logEvent);

    console.log("connecting to AP...");

    const connectionInfo = {
        hostname: hostname,
        port: port,
        game: "SimonTathamPuzzles",
        name: player,
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
    };

    try {
        await client.connect(connectionInfo);
    } catch (e) {
        console.log(e)
        console.error("Couldn't connect")
        return;
    }

    console.log("connected to AP");

    let slotData = client.data.slotData;
    const puzzleList = Alpine.store("puzzleList");

    puzzleList.entries = [];
    puzzleList.currentId = -1;
    puzzleList.current = [];

    let baseSeed = slotData.world_seed;

    for (let i = 0; i < slotData.puzzles.length; i++) {
        let options = {locked: true}

        let newEntry = ArchipelagoPuzzle.fromArchipelagoString(slotData.puzzles[i], baseSeed, i+1, options)

        puzzleList.entries.push(newEntry);
    }

    // Temporarily pad to 25 puzzles
    for (let i = puzzleList.entries.length; i < 25; i++) {
        let options = {locked: true}

        let newEntry = ArchipelagoPuzzle.fromArchipelagoString("fifteen:2x2", baseSeed, i+1, options)

        puzzleList.entries.push(newEntry);
    }

    apReady = true;
    syncAPStatus();
}

// Expose UI functions to global scope
// I should probably move these to Alpine
window.newPuzzle = newPuzzle;
window.restartPuzzle = restartPuzzle;
window.undoPuzzle = undoPuzzle;
window.redoPuzzle = redoPuzzle;
window.solvePuzzle = solvePuzzle;
window.setPreset = setPreset;

// Expose some variables to global scope for ease of debugging
window.Alpine = Alpine;
window.store = Alpine.store;
window.client = client;
window.Client = Client;
window.ArchipelagoPuzzle = ArchipelagoPuzzle;

Alpine.start();