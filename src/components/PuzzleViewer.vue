<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, useId, useTemplateRef } from 'vue';
import { Modal, Toast } from 'bootstrap';
import type { GenrePresetElement, GenrePresetList, GenrePresetSubmenuElement } from '@/types/GenrePresetList';

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

const id = useId();
const puzzleFrame = useTemplateRef("puzzleFrame")
const puzzleModalElem = useTemplateRef("puzzleModalElem")
const errorToastElem = useTemplateRef("errorToastElem")
const puzzleModal = shallowRef<Modal | undefined>()
const errorToast = shallowRef<Toast | undefined>()

const frameSource = ref("about:blank")
const dialogVisible = ref(false)
const dialogTitle = ref("")
const dialogError = ref("")
const dialogControls = ref<PuzzleDialogControl[]>([])
const errorText = ref("")

//
// Public interface
//

defineExpose({
    newPuzzle, showPreferences, selectPreset
})

const presetList = defineModel<GenrePresetList>("presetList")
const currentPreset = defineModel<number>("currentPreset")

function confirmModal() {
    if (dialogVisible.value) {
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
        //TODO: Lock modal while waiting for cleanup (in case of error)
    }
}

function cancelModal() {
    if (dialogVisible.value) {
        sendMessage("dialogCancel");

        dialogVisible.value = false
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

function selectPreset(index: number) {
    currentPreset.value = index
    sendMessage("setPreset", index)
}

const messageHandlers: {[command: string]: (...args: any[]) => void | undefined} = {
    ready() {
        console.log("puzzle viewer: ready")
    },
    js_init_puzzle() {
        console.log("puzzle viewer: init_puzzle")
        presetList.value = {0: []}
    },
    js_post_init() {
        console.log("puzzle viewer: post_init")
    },
    js_update_permalinks() {},
    js_enable_undo_redo() {},
    js_remove_solve_button() {},
    js_update_status() {},
    js_update_key_labels() {},
    js_add_preset(menuId: number, title: string, index: number) {
        if (!presetList.value) {
            throw new Error("Tried to add preset before initialization")
        }

        let newPreset: GenrePresetElement = {
            type: "preset",
            title,
            index
        }

        if (presetList.value[menuId]) {
            presetList.value[menuId].push(newPreset)
        } else {
            presetList.value[menuId] = [newPreset]
        }
    },
    js_add_preset_submenu(parentId, title, newId) {
        if (!presetList.value) {
            throw new Error("Tried to add preset submenu before initialization")
        }
        let newMenu: GenrePresetSubmenuElement = {
            type: "submenu",
            title,
            index: newId
        }

        if (presetList.value[parentId]) {
            presetList.value[parentId].push(newMenu)
        } else {
            presetList.value[parentId] = [newMenu]
        }
    },
    js_select_preset(index) {
        currentPreset.value = index
    },
    js_dialog_init(titletext) {
        dialogTitle.value = titletext;
        dialogError.value = "";
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
    js_dialog_cleanup() {
        if (dialogVisible.value) {
            dialogVisible.value = false
            puzzleModal.value?.hide();
        }
    },
    js_canvas_set_statusbar() {},
    js_canvas_remove_statusbar() {},
    js_canvas_set_size() {},
    js_error_box(text) {
        if (dialogVisible.value) {
            dialogError.value = text;
        } else {
            errorText.value = text
            errorToast.value?.show()
        }
    },
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
    if (!errorToastElem.value) {
        throw new Error("Error toast not initialized")
    }
    if (!puzzleFrame.value) {
        throw new Error("Puzzle frame not initialized")
    }

    puzzleModal.value = new Modal(puzzleModalElem.value)
    puzzleModalElem.value.addEventListener("hide.bs.modal", onModalHide)
    errorToast.value = new Toast(errorToastElem.value)

    frameSource.value = "puzzleframe.html?g=loopy"

    window.addEventListener("message", processMessage)

    presetList.value = [];
})

onUnmounted(() => {
    window.removeEventListener("message", processMessage)
})

</script>

<template>
    <iframe :src="frameSource" ref="puzzleFrame" class="puzzleframe"></iframe>

    <Teleport to="body">
        <div class="modal fade puzzledialog" tabindex="-1" ref="puzzleModalElem">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 :id="`dialog-title-${id}`">{{ dialogTitle }}</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning" v-if="dialogError">
                            <strong>Error</strong>
                            <br>
                            {{ dialogError }}
                        </div>
                        <form>
                            <div v-for="control in dialogControls">
                                <div v-if="control.type == 'string'" class="mb-3">
                                    <label :for="`dialog-control-${control.index}-${id}`" class="form-label">{{ control.title }}</label>
                                    <input v-model="control.value" class="form-control" :id="`dialog-control-${control.index}-${id}`">
                                </div>
                                <div v-if="control.type == 'boolean'" class="mb-3 form-check">
                                    <input v-model="control.value" type="checkbox" class="form-check-input" :id="`dialog-control-${control.index}-${id}`">
                                    <label class="form-check-label" :for="`dialog-control-${control.index}-${id}`">{{ control.title }}</label>
                                </div>
                                <div v-if="control.type == 'choice'" class="mb-3">
                                    <label :for="`dialog-control-${control.index}-${id}`" class="form-label">{{ control.title }}</label>
                                    <select v-model="control.value" class="form-select" :id="`dialog-control-${control.index}-${id}`">
                                        <option v-for="(display, index) in control.choices" :value="index" :selected="index == control.value">{{ display }}</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" @click="confirmModal()">OK</button>
                        <button class="btn btn-secondary" @click="cancelModal()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
    <Teleport to="#toast-container">
        <div ref="errorToastElem" data-bs-autohide="false" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Error</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                {{ errorText }}
            </div>
        </div>
    </Teleport>
</template>

<style>
.puzzleframe {
    border: 2px solid black;
    width: 100%;
    height: 500px;
}

.puzzledialog h1 {
    font-size: 150%;
}
</style>