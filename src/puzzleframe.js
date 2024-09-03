var solved = false;
var puzzleId = "";
var disableNewGame = false;

window.onload = function() {
    let queryFragment = new URLSearchParams(window.location.search);

    let genre = queryFragment.get("g");

    if (queryFragment.has("i")) {
        puzzleId = queryFragment.get("i");
    }

    if (queryFragment.has("s")) {
        disableNewGame = true;
    }

    loadPuzzle(genre);

    window.parent.postMessage(["ready"]);
}

//
// Event handlers from messages from parent frame
//

function loadPuzzle(name) {
    let elem = document.createElement("script")
    elem.setAttribute("src", `res/${name}.js`)
    document.head.appendChild(elem)
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

function setPreset(id) {
    menuform.elements["preset"].value = id;
    command(2);
}

function setNewGameEnabled(allow) {
    disableNewGame = !allow;
}

function dialogReturnString(index, val) {
    dlg_return_sval(index, val);
}

function dialogReturnInt(index, val) {
    dlg_return_ival(index, val);
}

function dialogConfirm() {
    command(3);
}

function dialogCancel() {
    command(4);
}

const messageHandlers = {
    loadPuzzle, setPreset,
    newPuzzle, restartPuzzle, undoPuzzle, redoPuzzle, solvePuzzle,
    dialogReturnString, dialogReturnInt, dialogConfirm, dialogCancel,
    setNewGameEnabled
}

function processMessage(message) {
    console.log("to puzzleframe.html:", message.data)

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
