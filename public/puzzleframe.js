var solved = false;
var genre = "";
var puzzleId = "";
var allowNewGame = true;

window.onload = function() {
    let queryFragment = new URLSearchParams(window.location.search);

    genre = queryFragment.get("g");

    if (queryFragment.has("i")) {
        puzzleId = queryFragment.get("i");
    }

    if (queryFragment.has("s")) {
        allowNewGame = false;
    }

    if (genre) {
        loadPuzzle(genre);
    }
    
    document.getElementById("puzzlecanvascontain").addEventListener("click", function() {
        document.getElementById("puzzlecanvas").focus()
    })

    window.parent.postMessage(["ready"]);
}

//
// Event handlers from messages from parent frame
//

function loadPuzzle(genre) {
    let elem = document.createElement("script")
    elem.setAttribute("src", `res/wasm/${genre}.js`)
    document.head.appendChild(elem)
}

function puzzleFromId() {
    command(0);
}

function puzzleFromSeed() {
    command(1);
}

function setPreset(id) {
    menuform.elements["preset"].value = id;
    command(2);
}

function dialogConfirm() {
    command(3);
}

function dialogCancel() {
    command(4);
}

function newPuzzle() {
    solved = false;
    command(5);
}

function restartPuzzle() {
    command(6);
}

function undoPuzzle() {
    command(7);
}

function redoPuzzle() {
    command(8);
}

function solvePuzzle() {
    command(9);
}

function showPreferences() {
    command(10);
}

function setNewGameEnabled(allow) {
    set_allowed_shortcuts(allow, allow, true)
}

function dialogReturnString(index, val) {
    dlg_return_sval(index, val);
}

function dialogReturnInt(index, val) {
    dlg_return_ival(index, val);
}

function savePuzzleData() {
    var savefile_ptr = get_save_file(); // defined in {genre}.js
    var savefile_text = UTF8ToString(savefile_ptr);
    free_save_file(savefile_ptr);

    sendMessage("savePuzzleDataCallback", savefile_text);
}

function loadPuzzleData(data) {
    // Encode data as UTF-8 Uint8Array
    let encoder = new TextEncoder();
    let dataArray = encoder.encode(data);

    let pos = 0;

    savefile_read_callback = function(buf, len) {
        if (pos + len > dataArray.length)
            return false;
        writeArrayToMemory(
            dataArray.slice(pos, pos + len), buf);
        pos += len;
        return true;
    }
    load_game(); // defined in {genre}.js
    savefile_read_callback = null;
}

const messageHandlers = {
    loadPuzzle, setPreset, showPreferences,
    newPuzzle, puzzleFromId, puzzleFromSeed, restartPuzzle, undoPuzzle, redoPuzzle, solvePuzzle,
    dialogReturnString, dialogReturnInt, dialogConfirm, dialogCancel,
    setNewGameEnabled,
    savePuzzleData, loadPuzzleData
}

function processMessage(message) {
    if (!message.data[Symbol.iterator]) return;

    let [command, ...args] = message.data

    if (command) {
        let handler = messageHandlers[command]
        if (handler) {
            handler(...args)
        } else {
            console.warn("No handler found for message", message.data[0])
        }
    }
}

window.onmessage = processMessage

//
// Event handlers for events from puzzle JS
//

function sendMessage(command, ...args) {
    // Kludge to listen for post-init
    if (command == "js_post_init") {
        if (!allowNewGame) {
            setNewGameEnabled(false)
        }
    }

    window.parent.postMessage([command, ...args], "*")
}

function setBackgroundColor(colorString) {
    document.getElementById("puzzlecanvascontain").style.backgroundColor = colorString
}

function onSolve() {
    if (!solved) {
        solved = true;
        sendMessage("onSolve")
    }
}