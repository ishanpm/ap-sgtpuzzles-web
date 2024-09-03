const { Client, ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE } = require("archipelago.js");
const Alpine = require('alpinejs').default;

document.addEventListener("alpine:init", onInit)

var puzzleframe;
var client;

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
            {id: 1, genre: "loopy", puzzleId: "7x7e#123", desc: "Loopy - 7x7 Easy", state: "locked"},
            {id: 2, genre: "net", puzzleId: "5x5#123", desc: "Net - 5x5", state: "unsolved"},
            {id: 3, genre: "net", puzzleId: "2x2#456", desc: "Net - 2x2", state: "unsolved"},
            {id: 4, genre: "fifteen", puzzleId: "2x2#123", desc: "Fifteen - 2x2", state: "unsolved"}
        ],
        currentId: -1,
        current: null,
        selectPuzzle(entry) {
            if (entry.state == "locked" || entry.id == this.currentId) {
                return;
            }

            this.currentId = entry.id;
            this.current = entry;
            loadPuzzle(entry.genre, entry.puzzleId, true);
        },
        markSolved() {
            // TODO check if puzzle is actually initialized
            if (this.current) {
                this.current.state = "solved";
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

async function connectAP(hostname, port, player) {
    const connectionInfo = {
        hostname: hostname, // Replace with the actual AP server hostname.
        port: port, // Replace with the actual AP server port.
        game: "SimonTathamPuzzles",
        name: player, // Replace with the player slot name.
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
    };

    client = new Client();
    window.client = client;

    await client.connect(connectionInfo);

    console.log("connected to AP");

    let slotData = client.data.slotData;
    const puzzleList = Alpine.store("puzzleList");

    puzzleList.entries = [];
    puzzleList.currentId = -1;
    puzzleList.current = [];

    for (let i = 0; i < slotData.puzzles.length; i++) {
        let puzzleMatch = /^([^:]*):(([^#:]*)((#|:).*))?$/.exec(slotData.puzzles[i]);
        let id = i+1;
        let genre = puzzleMatch[1];
        let puzzleId = puzzleMatch[2]
        let puzzleParams = puzzleMatch[3];

        let newEntry = {
            id,
            genre,
            puzzleId,
            desc: `${genre}: ${puzzleParams}`,
            state: "unlocked"
        };

        puzzleList.entries.push(newEntry);
    }
}

// Expose some variables to global scope for ease of debugging
window.Alpine = Alpine;
window.store = Alpine.store;
window.client = client;
window.Client = Client;

Alpine.start();