const {
    Client, ITEMS_HANDLING_FLAGS, SERVER_PACKET_TYPE, LocationsManager, ReceivedItemsPacket,
    clientStatuses,
    itemsHandlingFlags
} = require("archipelago.js");
const Alpine = require('alpinejs').default;
const $ = require('jquery')
const SaveData = require("./savedata.js");
const {GameSave, getFile, getFileList, openDatabase} = SaveData;
const {config} = require("config")
const {genres, genreInfo} = require("./genres.js")

document.addEventListener("alpine:init", onInit)

let puzzleframe;
let apReady = false;

/**
 * @type{import("archipelago.js").JSONRecord}
 */
let slotData;

/**
 * @type{Client}
 */
let client;

let remoteSolved = {};

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
        let name = genreInfo[this.genre].name;

        if (this.params) {
            this.desc = `${name}: ${this.params}`;
        } else {
            this.desc = name;
        }
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
        if (isApReady()) {
            let locationId = locationNameToId(`Puzzle ${this.index} Reward`);

            client.check(locationId);
        }
    }

    static fromArchipelagoString(genreAndParams, baseSeed, index, options) {
        options ??= {};

        const archipelagoStringRegex = /^(?<genre>[^:\n]*)(:(?<params>[^:#\n]*)((?<separator>[:#])?(?<seedOrId>.*)))?$/
        let genreParamsMatch = archipelagoStringRegex.exec(genreAndParams);

        let genre = genreParamsMatch.groups.genre;
        let params = genreParamsMatch.groups.params;
        let separator = genreParamsMatch.groups.separator;
        let seedOrId = genreParamsMatch.groups.seedOrId;

        options.genre = genre;
        options.params = params;
        options.index = index;

        if (separator == ":") {
            options.puzzleSeed = `${params}:${seedOrId}`;
        } else if (separator == "#") {
            options.puzzleId = `${params}#${seedOrId}`;
        } else {
            // Auto-generate seed
            let seedPrefix = ""+index;
            seedPrefix = seedPrefix.padStart(3, "0");
            let seed = `${seedPrefix}${baseSeed}`;
            options.puzzleSeed = `${params}#${seed}`;
        }

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
        entries: [],
        sortedEntries: [],
        currentIndex: -1,
        current: null,
        solveCount: 0,
        solveTarget: null,
        finished: false,
        sortBySolved: false,
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
                loadPuzzle(entry.genre, entry.puzzleId, true, entry.index);
            } else if (entry.puzzleSeed) {
                loadPuzzle(entry.genre, entry.puzzleSeed, true, entry.index);
            } else {
                loadPuzzle(entry.genre, "", false);
            }
        },
        markSolved(puzzle) {
            puzzle ??= this.current

            if (puzzle) {
                puzzle.onSolve();

                if (puzzle == this.current) {
                    savePuzzleData();
                }

                const gamesaves = Alpine.store("gamesaves")

                if (puzzle.index && gamesaves.current) {
                    gamesaves.current.puzzleSolved[puzzle.index-1] = true;
                    gamesaves.current.save();
                    syncAPStatus();
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
            
            if (this.sortBySolved) {
                sortedEntries.sort((a,b) => compare(sortKey(a), sortKey(b)) || compare(a.id, b.id))
            } else {
                sortedEntries.sort((a,b) => compare(a.id, b.id))
            }

            this.sortedEntries = sortedEntries;

            this.solveCount = this.entries.reduce((a,b) => (b.solved ? a+1 : a), 0)
        },
        onFinishClick() {
            if (this.solveTarget !== null && this.solveCount >= this.solveTarget) {
                client.updateStatus(clientStatuses.goal);
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
        loaded: false,
        solved: false,
        status: 0,
        genre: null,
        genreInfo: genreInfo["none"],
        gameId: "",
        gameSeed: "",
        reset() {
            this.solved = false;
            this.undoEnabled = false;
            this.redoEnabled = false;
            this.solveEnabled = true;
            this.primaryKeyLabel = "";
            this.secondaryKeyLabel = "";
            this.loaded = false;
            this.solved = false;
            this.status = 0;
            this.genre = null;
            this.genreInfo = genreInfo["none"];
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

    // Chat box
    Alpine.store("chatbox", {
        collapsed: true,
        unreadCount: 0,
        composeText: "",
        messages: [],
        messageCount: 0,
        toggleCollapsed() {
            this.collapsed = !this.collapsed;

            if (!this.collapsed) {
                this.scrollToBottom(true)
            }
        },
        appendMessage(message) {
            message.id = this.messageCount++;

            this.messages.push(message)

            const messageLimit = 1000;

            if (this.messages.length > messageLimit) {
                this.messages = this.messages.slice(this.messages.length - messageLimit)
            }

            // TODO: separate notification for priority messages?
            // if (message.highlight || message.type == 'chat') {
            //     this.unreadCount++;
            // }
            this.unreadCount++;
            this.scrollToBottom(false)
        },
        scrollToBottom(force) {
            let isPinned = false;

            if (force) {
                isPinned = true;
            } else {
                let elem = $("#chat-history");
                if (elem.length == 0) return;

                // Check if we are scrolled to the bottom
                const scrollPinHeight = 10
                if (elem.scrollTop() + elem.innerHeight() >= elem[0].scrollHeight - scrollPinHeight) {
                    isPinned = true;
                }
            }

            if (isPinned) {
                this.unreadCount = 0;

                // Wait until next tick so any new messages can render
                Alpine.nextTick(() => {
                    let elem = $("#chat-history");
                    elem.scrollTop(elem[0].scrollHeight);
                })
            }
        },
        appendEcho(text) {
            this.appendMessage({type: 'echo', data: [{text: text}], highlight: false})
        },
        sendChat(text) {
            sendChat(text)
            this.scrollToBottom(true)
            this.composeText = "";
        }
    })

    // Widget to load puzzles on-demand
    // TODO make this with proper UI
    Alpine.store("debugLoader", {
        genre: "net",
        id: "",
        singleMode: false,
        showUnsupported: false,
        load() {
            Alpine.store("puzzleList").selectPuzzle(null);
            loadPuzzle(this.genre, this.id, this.singleMode);
        }
    })

    Alpine.store("connectionInfo", {
        hostname: config.defaultHost,
        port: "38281",
        player: "Player1",
        password: "",
        connect() {
            createFile(this.hostname, +this.port, this.player, this.password);
        },
        replaceConnectionInfo() {
            let currentFile = Alpine.store("gamesaves").current;
            let newConnection = {
                host: this.hostname,
                port: +this.port,
                player: this.player,
                password: this.password
            }
            if (currentFile && currentFile.id != -1) {
                loadFile(currentFile, false, newConnection)
            }
        }
    })

    // TODO a lot of this should be moved to connectionInfo (possibly all of it)
    Alpine.store("gamesaves", {
        list: [],
        current: null,
        apError: false,
        connecting: false,
        connected: false,
        loadFile(file, secretMode) {
            loadFile(file, secretMode);
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

    Alpine.store("config", config)

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

async function loadPuzzle(genre, id, singleMode, saveKey) {
    let debugLoader = Alpine.store("debugLoader");
    let puzzleState = Alpine.store("puzzleState");

    if (!genre) {
        id = undefined;
        singleMode = true;
    }

    resetPuzzleMetadata();
    debugLoader.genre = genre;
    debugLoader.id = id;
    debugLoader.singleMode = !!singleMode;
    puzzleState.genre = genre;
    puzzleState.genreInfo = genreInfo[genre || "none"];

    Alpine.store("singleMode", !!singleMode)

    const puzzleFrameBase = "puzzleframe.html";

    const gamesaves = Alpine.store("gamesaves");

    let hasSave = false;

    if (gamesaves.current && saveKey !== null && saveKey !== undefined) {
        let saveData = await gamesaves.current.getPuzzleSave(saveKey);
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
    puzzleframe.width = 0;
    puzzleframe.height = 0;
}

async function clearPuzzle() {
    return await loadPuzzle("");
}

//
// puzzleFrame message handlers
//

function onPuzzleFrameLoad() {
    console.log("puzzles.html: puzzleframe ready")
}

function js_init_puzzle() {
    
}

function js_post_init() {
    loadPuzzleData();
    Alpine.store("puzzleState").loaded = true;
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
    puzzleframe.width = w / window.devicePixelRatio;
    puzzleframe.height = h / window.devicePixelRatio;
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

function setNewGameEnabled(allowNewGame) {
    sendMessage("setNewGameEnabled", allowNewGame)
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

async function deletePuzzleData(index) {
    const gamesaves = Alpine.store("gamesaves");
    const puzzleList = Alpine.store("puzzleList");

    if (gamesaves.current) {
        index ??= puzzleList.current?.index
    }
    if (index === undefined) return;

    await gamesaves.current.deletePuzzleSave(index);

    return;
}

function hasItem(itemId) {
    return client.items.received.findIndex(e => e.id == itemId) > -1;
}

function syncAPStatus() {
    const puzzleList = Alpine.store("puzzleList");

    if (!isApReady()) {
        puzzleList.resort();
        return;
    };

    const gamesaves = Alpine.store("gamesaves");

    let allSolved = true;
    let currentFile = gamesaves.current;

    let fileDirty = false;

    let newRemoteSolves = {};
    let anyNewRemoteSolves = false;

    for (let entry of puzzleList.entries) {
        let dirty = false;
        let itemId = itemNameToId(`Puzzle ${entry.index}`);
        let locationId = locationNameToId(`Puzzle ${entry.index} Reward`);

        if (!entry.collected && client.room.checkedLocations.includes(locationId)) {
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

        if (entry.solved && !(entry.index in remoteSolved)) {
            newRemoteSolves[entry.index] = 1;
            remoteSolved[entry.index] = 1;
            anyNewRemoteSolves = true;
        }
    }

    if (anyNewRemoteSolves) {
        console.log("newly solved: ", newRemoteSolves)
        let team = client.players.self.team
        let slot = client.players.self.slot
        let key = `sgtpuzzles_solves_${team}_${slot}`
        client.storage.prepare(key, {})
            .update(newRemoteSolves)
            .commit()
    }

    puzzleList.resort();

    if (fileDirty) {
        currentFile.save();
    }
}

async function createFile(hostname, port, player, password) {
    const gamesaves = Alpine.store("gamesaves")
    gamesaves.connecting = true;

    disconnectAP();

    gamesaves.apError = false;

    try {
        await connectAP(hostname, port, player, password);
    } catch (e) {
        alert("Couldn't connect to Archipelago server.");
        console.error("Couldn't connect to Archipelago server");
        console.error(e);

        gamesaves.apError = true;
        gamesaves.connecting = false;

        return;
    }

    let fileVersion = slotData.file_version ?? 0

    console.log(`file_version = ${slotData.file_version}`)
    console.log(`world_version = ${slotData.world_version}`)

    if (fileVersion > 1) {
        alert(`World is version ${slotData.world_version}, which is not compatible with this web client version. Some features may not work as expected.`)
    }

    let newFile = new GameSave({
        host: hostname,
        port: port,
        player: player,
        password: password,
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
    initRemoteSolves();
    syncAPStatus();
}

/**
 * 
 * @param {SaveData.GameSave} file 
 */
async function loadFile(file, secretMode, newConnection) {
    const gamesaves = Alpine.store("gamesaves")
    gamesaves.connecting = true;
    gamesaves.current = file;

    disconnectAP();

    gamesaves.apError = false;
    let connectOk = false;

    let host, port, player, password;

    if (newConnection) {
        host = newConnection.host ?? file.host;
        port = newConnection.port ?? file.port;
        player = newConnection.player ?? file.player;
        password = newConnection.password ?? file.password;
    } else {
        host = file.host;
        port = file.port;
        player = file.player;
        password = file.password;
    }

    if (host) {
        try {
            await connectAP(host, port, player, password);
            connectOk = true;
        } catch (e) {
            if (newConnection) {
                alert("Couldn't connect to Archipelago server. Reload this file to connect with previous information.")
            } else {
                alert("Couldn't connect to Archipelago server. (You can still solve unlocked puzzles on this file.)")
            }
            gamesaves.apError = true;
            console.error(e);
        }
    }

    if (connectOk) {
        // Verify puzzle list and seed match
        function anyMismatch() {
            if (file.baseSeed != "" + slotData.world_seed) return true;
            if (file.puzzles.length != slotData.puzzles.length) return true;

            for (let i = 0; i < file.puzzles.length; i++) {
                if (file.puzzles[i] != slotData.puzzles[i]) return true;
            }

            return false;
        }

        if (anyMismatch()) {
            if (newConnection) {
                alert("The Archipelago server data doesn't match this save file. Reload this file to connect with previous information.")
            } else {
                alert("The Archipelago server data doesn't match this save file. (You can still solve unlocked puzzles.)")
            }
            disconnectAP();
            connectOk = false;
            gamesaves.apError = true;
        }
    }

    if (newConnection && connectOk) {
        file.host = host;
        file.port = port;
        file.player = player;
        file.password = password;

        file.updateDescription();
        file.save();
    }

    await clearPuzzle();

    loadFileData(file, secretMode);

    if (connectOk) {
        apReady = true;
        gamesaves.connected = true;
        initRemoteSolves();
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

    let defaultGame = new GameSave({
        id: -1,
        filename: "Freeplay",
        puzzles: genres.filter(e => true),
        puzzleLocked: genres.map(e => false)
    });

    gamesaves.list.unshift(defaultGame);

    gamesaves.loadFile(defaultGame);
}

function onReceiveItems(event) {
    if (isApReady()) {
        syncAPStatus();
    }
}

function logEvent(event) {
    console.log(event);
}

/**
 * @param {import("archipelago.js").PrintJSONPacket} event 
 * @deprecated
 */
function onPrintJson(event) {
    function processMessagePart(part) {
        const itemTypes = {0: 'filler', 1: 'progression', 2: 'useful', 4: 'trap'}
        switch (part.type) {
            case "player_id":
                return {text: playerIdToName(+part.text), detail: part.text, type: "player"}
            case "item_id":
                return {text: itemIdToName(+part.text), detail: part.text, type: "item", itemType: itemTypes[part.flags]}
            case "location_id":
                return {text: locationIdToName(+part.text), detail: part.text, type: "location"}
            default: return part
        }
    }

    const chatbox = Alpine.store("chatbox")
    let mySlot = client.players.self.slot;

    let highlight = false
    if (event.item && event.item.player === mySlot) {
        highlight = true;
    }
    if (event.receiving === mySlot) {
        highlight = true;
    }

    const newMessage = {
        type: (event.type ?? 'unknown').toLowerCase(),
        data: event.data.map(processMessagePart),
        highlight: highlight
    }
    chatbox.appendMessage(newMessage)
}

/**
 * @param {string} text
 * @param {import("archipelago.js").MessageNode[]} nodes 
 */
function onMessage(text, nodes) {
    const chatbox = Alpine.store("chatbox")


    // TODO message pretty printing
    const newMessage = {
        type: "message",
        data: [{text: text}],
        highlight: false
    }

    chatbox.appendMessage(newMessage)
}

/**
 * @param {import("archipelago.js").SetReplyPacket} event 
 */
function onSetReply(event) {
    let team = client.players.self.team
    let slot = client.players.self.slot
    let key = `sgtpuzzles_solves_${team}_${slot}`

    if (event.key == key) {
        copyRemoteSolves(event.value)
    }
}

/**
 * @param {import("archipelago.js").RetrievedPacket} event 
 */
function onKeysRetreived(event) {
    let team = client.players.self.team
    let slot = client.players.self.slot
    let key = `sgtpuzzles_solves_${team}_${slot}`

    console.log("KeysRetrieved", event)
    
    if (event.keys[key]) {
        copyRemoteSolves(event.keys[key])
    }
}

function copyRemoteSolves(solves) {
    console.log(solves)
    let puzzleList = Alpine.store("puzzleList")

    let oldRemoteSolved = {};
    Object.assign(oldRemoteSolved, remoteSolved)

    for (let id in solves) {
        if (!(id in oldRemoteSolved)) {
            console.log(`adding remote solve ${id}`)
            remoteSolved[id] = solves[id];
            puzzleList.markSolved(puzzleList.entries[id-1]);
        }
    }
}

function onDisconnected() {
    if (apReady) {
        Alpine.store("gamesaves").apError = true
    }
    apReady = false;
    console.log("disconnected")

    const chatbox = Alpine.store("chatbox")
    chatbox.appendEcho("Disconnected from Archipelago.")
}

function sendChat(text) {
    const chatbox = Alpine.store("chatbox")

    if (!text) return;

    if (text[0] == "/") {
        return handleSlashCommand(text)
    }

    if (!client || !apReady) {
        chatbox.appendEcho("Not connected to Archipelago.")
        return
    }
    client.messages.say(text)
}

async function handleSlashCommand(text) {
    const chatbox = Alpine.store("chatbox")
    const puzzleList = Alpine.store("puzzleList")

    chatbox.appendEcho(text)

    let parts = text.trim().split(/\s+/)
    let command = parts[0] ?? ""

    if (command == "/debugon") {
        Alpine.store("debugMode", true)
        chatbox.appendEcho("Debug mode enabled.")
    } else if (command  == "/debugoff") {
        Alpine.store("debugMode", false)
        chatbox.appendEcho("Debug mode disabled.")
    } else if (command == "/delete_puzzle_data") {
        if (isNaN(parts[1])) {
            chatbox.appendEcho("Specify a puzzle number.")
            return
        }

        let puzzleIndex = +parts[1]
        let puzzle = puzzleList.entries[puzzleIndex-1];
        if (!puzzle) {
            chatbox.appendEcho("No puzzle with that number.")
            return
        }

        await deletePuzzleData(puzzleIndex)
        chatbox.appendEcho(`Deleted save data for "${puzzle.desc}".`)
    } else if (command == "/set_puzzle_seed") {
        if (isNaN(parts[1])) {
            chatbox.appendEcho("Specify a puzzle number.")
        }

        let puzzleIndex = +parts[1]
        let puzzle = puzzleList.entries[puzzleIndex-1];
        if (!puzzle) {
            chatbox.appendEcho("No puzzle with that number.")
        }

        let newSeed = parts[2] ?? "";

        puzzle.puzzleSeed = newSeed
        puzzle.updateDescription()

        chatbox.appendEcho(`Updated seed for "${puzzle.desc}".`)
    } else if (command == "/solve_collected") {
        let solveCount = 0
        for (let puzzle of puzzleList.entries) {
            if (!puzzle.locked && !puzzle.solved && puzzle.collected) {
                puzzleList.markSolved(puzzle)
                solveCount++;
            }
        }
        chatbox.appendEcho(`${solveCount} puzzle(s) marked solved.`)
    } else if (command == "/show_unsupported") {
        Alpine.store("debugLoader").showUnsupported = true;
        chatbox.appendEcho("Unsupported genres are now enabled in Freeplay.")
    } else if (command == "/help") {
        chatbox.appendEcho(
            "These commands are used to cheat or work around generation errors. Use at your own risk:\n\n"+

            "/debugon - Enable debug mode\n"+
            "/debugoff - Disable debug mode\n"+
            "/delete_puzzle_data [num] - Delete save data for a specific puzzle\n"+
            "/set_puzzle_seed [num] [newParameters] - Overwrite the seed for a specific puzzle\n"+
            "/solve_collected - Auto-solve all puzzles whose locations have been checked\n"+
            "/show_unsupported - Display unfinished and unsupported genres in Freeplay"
        )
    } else {
        chatbox.appendEcho("Unknown command. Use /help to see available commands.")
    }
}

async function connectAP(hostname, port, player, password) {
    if (!client) {
        client = new Client();
        window.client = client;

        // TODO probably unnecessary to sync both due to ReceivedItems and RoomUpdate..?
        client.socket.on("receivedPacket", logEvent);
        client.socket.on("receivedItems", onReceiveItems);
        client.socket.on("roomUpdate", syncAPStatus);
        client.socket.on("setReply", onSetReply)
        client.socket.on("retrieved", onKeysRetreived)
        client.socket.on("disconnected", onDisconnected);

        client.messages.on("message", onMessage);
    }

    remoteSolved = {};

    console.log("connecting to AP...");

    const connectionInfo = {
        password: password ?? ""
    };

    let connectionURL = `${hostname}:${port}`
    const game = "Simon Tatham's Portable Puzzle Collection"

    slotData = await client.login(connectionURL, player, game, connectionInfo);

    console.log("connected to AP");

    syncAPStatus();
    
    const chatbox = Alpine.store("chatbox")
    chatbox.appendEcho("Connected to Archipelago.")
}

function isApReady() {
    return apReady && client.authenticated;
}

function initRemoteSolves() {
    let team = client.players.self.team
    let slot = client.players.self.slot
    let key = `sgtpuzzles_solves_${team}_${slot}`

    client.socket.send({cmd:"SetNotify", keys:[key]})
    client.socket.send({cmd:"Get", keys:[key]})
}

function itemIdToName(id) {
    return client.package.findPackage("Simon Tatham's Portable Puzzle Collection").reverseItemTable[id]
}

function itemNameToId(name) {
    return client.package.findPackage("Simon Tatham's Portable Puzzle Collection").itemTable[name]
}

function locationIdToName(id) {
    return client.package.findPackage("Simon Tatham's Portable Puzzle Collection").reverseLocationTable[id]
}

function locationNameToId(name) {
    return client.package.findPackage("Simon Tatham's Portable Puzzle Collection").locationTable[name]
}

function playerIdToName(id) {
    return client.players.slots[id].name
}

/**
 * 
 * @param {SaveData.GameSave} file
 */
function loadFileData(file, secretMode) {
    const puzzleList = Alpine.store("puzzleList");

    if (secretMode) {
        console.log("waow")
    }

    let isFreeplay = (file.id < 0);
    let showUnsupported = Alpine.store("debugLoader").showUnsupported;

    // TODO styling sometimes doesn't update when reconnecting while a puzzle is selected.
    // Seems like a bug with Alpine (or with how I'm using it), I'll probably have to switch to a different
    // UI/reactivity library
    puzzleList.entries = [];
    puzzleList.sortedEntries = [];
    puzzleList.selectPuzzle(null);
    puzzleList.solveTarget = file?.solveTarget ?? null;
    puzzleList.finished = file.finished;
    puzzleList.sortBySolved = !isFreeplay;

    for (let i = 0; i < file.puzzles.length; i++) {
        let options = {locked: file.puzzleLocked[i], solved: file.puzzleSolved[i]}

        let newEntry;
        if (isFreeplay) {
            newEntry = ArchipelagoPuzzle.fromPuzzlesString(file.puzzles[i], null, i+1)

            if (!showUnsupported && ((genreInfo[newEntry.genre].hidden && !secretMode) || genreInfo[newEntry.genre].evenMoreHidden)) {
                // Skip hidden genres
                continue;
            }
        } else {
            newEntry = ArchipelagoPuzzle.fromArchipelagoString(file.puzzles[i], file.baseSeed, i+1, options)
        }

        puzzleList.entries.push(newEntry);
    }

    puzzleList.resort();
}

function disconnectAP() {
    const gamesaves = Alpine.store("gamesaves")
    apReady = false;
    gamesaves.connected = false;
    if (client && client.socket.connected) {
        console.log("disconnecting from AP...");
        client.socket.disconnect();
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
window.deletePuzzleData = deletePuzzleData;

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