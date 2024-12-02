<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, useTemplateRef } from 'vue';
import { Modal } from 'bootstrap';

interface PuzzleDialogStringControl {
    type: "string",
    index: number,
    title: string,
    value: string
}

interface PuzzleDialogChoiceControl {
    type: "choice",
    index: number,
    title: string,
    value: number,
    choices: string[]
}

interface PuzzleDialogBooleanControl {
    type: "boolean",
    index: number,
    title: string,
    value: boolean
}

type PuzzleDialogControl = PuzzleDialogStringControl | PuzzleDialogChoiceControl | PuzzleDialogBooleanControl

const puzzleFrame = useTemplateRef("puzzleFrame")
const puzzleModalElem = useTemplateRef("puzzleModalElem")
const puzzleModal = shallowRef<Modal | undefined>()

const frameSource = ref("about:blank")
const dialogVisible = ref(false)
const dialogControls = ref<PuzzleDialogControl[]>([])

function boop() {
    frameSource.value = "puzzleframe.html?g=loopy"
}

function confirmModal() {
    if (dialogVisible.value) {
        dialogVisible.value = false

        for (let elem of dialogControls.value) {
            switch (elem.type) {
                case "string":
                    sendMessage("dialogReturnString", elem.index, elem.value); break;
                case "choice":
                    sendMessage("dialogReturnInt", elem.index, elem.value); break;
                case "boolean":
                    sendMessage("dialogReturnInt", elem.index, elem.value ? 1 : 0); break;
            }
        }
        sendMessage("dialogConfirm");

        puzzleModal.value?.hide();
    }
}

function cancelModal() {
    if (dialogVisible.value) {
        dialogVisible.value = false

        sendMessage("dialogCancel");

        puzzleModal.value?.hide();
    }
}

function onModalHide() {
    if (dialogVisible.value) {
        dialogVisible.value = false
        sendMessage("dialogCancel");
    }
}

function newPuzzle() {
    sendMessage("newPuzzle")
}

function showPreferences() {
    sendMessage("showPreferences")
}

const messageHandlers: {[command: string]: (...args: any[]) => void | undefined} = {
    ready() {},
    js_init_puzzle() {},
    js_post_init() {},
    js_update_permalinks() {},
    js_enable_undo_redo() {},
    js_remove_solve_button() {},
    js_update_status() {},
    js_update_key_labels() {},
    js_add_preset() {},
    js_add_preset_submenu() {},
    js_select_preset() {},
    js_dialog_init() {
        dialogControls.value = [];
    },
    js_dialog_string(index: number, title: string, value: string) {
        dialogControls.value.push({type: "string", index, title, value})
    },
    js_dialog_choices(index: number, title: string, choiceStr: string, value: number) {
        // Split choiceStr by its first character
        let choices = choiceStr.split(choiceStr[0])
        choices.shift()

        dialogControls.value.push({type: "choice", index, title, value, choices})
    },
    js_dialog_boolean(index: number, title: string, rawValue: number) {
        dialogControls.value.push({type: "boolean", index, title, value: rawValue == 1})
    },
    js_dialog_launch() {
        puzzleModal.value?.show()
        dialogVisible.value = true
    },
    js_dialog_cleanup() {},
    js_canvas_set_statusbar() {},
    js_canvas_remove_statusbar() {},
    js_canvas_set_size() {},
    js_error_box() {},
    js_focus_canvas() {},
    savePuzzleDataCallback() {}
}

function processMessage(event: MessageEvent) {
    if (event.source != puzzleFrame.value?.contentWindow) return;
    if (!event.data[Symbol.iterator]) return;

    let command: string;
    let args: any[];
    [command, ...args] = event.data

    let handler: ((...args: any[]) => void) | undefined = messageHandlers[command];

    if (handler) {
        handler(...args)
    } else {
        console.warn("No handler for message:", command)
    }
}

function sendMessage(command: string, ...args: any[]) {
    if (!puzzleFrame.value) return;

    puzzleFrame.value.contentWindow?.postMessage([command, ...args])
}

onMounted(() => {
    if (!puzzleModalElem.value) {
        throw new Error("Puzzle modal not initialized")
    }

    if (!puzzleFrame.value) {
        throw new Error("")
    }

    puzzleModal.value = new Modal(puzzleModalElem.value)
    puzzleModalElem.value.addEventListener("hide.bs.modal", onModalHide)

    window.addEventListener("message", processMessage)
})

onUnmounted(() => {
    window.removeEventListener("message", processMessage)
})

</script>

<template>
    <iframe :src="frameSource" ref="puzzleFrame" class="puzzleframe" width="500" height="500"></iframe>

    <button class="btn btn-primary" @click="boop">Boop</button>
    <button class="btn btn-primary" @click="newPuzzle">New Game</button>
    <button class="btn btn-primary" @click="showPreferences">Preferences</button>

    <Teleport to="body">
        <div class="modal fade" ref="puzzleModalElem">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5>Title</h5>
                    </div>
                    <div class="modal-body">
                        <ul>
                            <li v-for="control in dialogControls">
                                <label v-if="control.type == 'string'">
                                    {{ control.title }}
                                    <input v-model="control.value">
                                </label>
                                <label v-if="control.type == 'choice'">
                                    {{ control.title }}
                                    <select v-model="control.value">
                                        <option v-for="(display, id) in control.choices" :value="id" :selected="id == control.value">{{ display }}</option>
                                    </select>
                                </label>
                                <label v-if="control.type == 'boolean'">
                                    <input type="checkbox" v-model="control.value"> {{ control.title }}
                                </label>
                            </li>
                        </ul>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" @click="confirmModal()">OK</button>
                        <button class="btn btn-secondary" @click="cancelModal()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style>
.puzzleframe {
    border: 2px solid black;
}
</style>