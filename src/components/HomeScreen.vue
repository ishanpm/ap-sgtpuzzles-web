<script setup lang="ts">
import { genres } from '@/genres';
import router from '@/router';
import { GameService, gameServiceKey } from '@/services/GameService';
import { SaveService, saveServiceKey } from '@/services/SaveService';
import { GameModel } from '@/types/GameModel';
import { PuzzleData } from '@/types/PuzzleData';
import { Modal } from 'bootstrap';
import { inject, onMounted, ref, shallowRef, useTemplateRef, watch, watchEffect } from 'vue';

const files = ref<{[id: number]: GameModel}>([])
const gameService = inject(gameServiceKey) as GameService
const saveService = inject(saveServiceKey) as SaveService
const freeplayState = ref(getFreeplayPuzzleState())

defineEmits<{
    fileClick: [file: GameModel]
}>()

const selectedFile = ref<GameModel>()
const fileIndex = ref<number | undefined>()
const host = ref<string>("archipelago.gg")
const port = ref<string>("38281")
const player = ref<string>("Player1")
const password = ref<string>("")
const filename = ref<string>("")

const fileDialogShowValidation = ref(false)
const fileDialogError = ref("")
const existingFile = ref(false)
const working = ref(false)

const fileDialogElem = useTemplateRef("fileDialogElem")
const fileDialog = shallowRef<Modal | undefined>()
const fileDialogForm = useTemplateRef("fileDialogForm")


async function refreshFiles() {
    let saves = await saveService.getFileList()

    files.value = saves
}

function getFreeplayPuzzleState() {
    let index = 1

    let puzzles = genres.map(g => {
        let puzzle = new PuzzleData(g)
        puzzle.key = "" + (index++)
        return puzzle
    })

    let gameModel = new GameModel()
    gameModel.freeplay = true
    gameModel.filename = "Freeplay"
    gameModel.puzzles = puzzles

    return gameModel
}

function showNewFileDialog() {
    host.value = "archipelago.gg"
    port.value = ""
    player.value = ""
    password.value = ""
    filename.value = ""
    fileIndex.value = undefined
    existingFile.value = false
    fileDialogShowValidation.value = false
    fileDialogError.value = ""

    fileDialog.value?.show()
}

function editFile(file: GameModel, id: number) {
    selectedFile.value = file
    host.value = file.host ?? ""
    port.value = ""+(file.port ?? "")
    player.value = file.player ?? ""
    password.value = file.password ?? ""
    filename.value = file.filename ?? ""
    fileIndex.value = id
    existingFile.value = true
    fileDialogShowValidation.value = false
    fileDialogError.value = ""

    fileDialog.value?.show()
}

async function confirmCreateFile() {
    if (!fileDialogForm.value) {
        throw new Error("File modal not initialized")
    }

    fileDialogShowValidation.value = true
    let valid = fileDialogForm.value.checkValidity()

    if (valid) {
        working.value = true

        try {
            let newFile = await gameService.newGame(host.value, +port.value, player.value, password.value || undefined)
            newFile.filename = filename.value || player.value
            let id = await saveService.saveFile(newFile)
            console.log(newFile)

            fileDialog.value?.hide()
            router.push(`/game/${id}`)
        } catch (e) {
            console.error(e)
            fileDialogError.value = ""+e
        }

        working.value = false
        refreshFiles()
    }
}

async function updateFile() {
    if (!fileDialogForm.value) {
        throw new Error("File modal not initialized")
    }
    if (!selectedFile.value) {
        console.error("No file selected")
        return;
    }

    fileDialogShowValidation.value = true
    let valid = fileDialogForm.value.checkValidity()
    if (!valid) return

    selectedFile.value.host = host.value
    selectedFile.value.port = +port.value
    selectedFile.value.player = player.value
    selectedFile.value.password = password.value || undefined
    selectedFile.value.filename = filename.value

    saveService.saveFile(selectedFile.value)

    fileDialog.value?.hide()

    refreshFiles()
}

async function deleteFile() {
    if (fileIndex.value === undefined) {
        console.error("No file selected")
        return;
    }

    saveService.deleteFile(fileIndex.value)

    fileDialog.value?.hide()

    refreshFiles()
}

function cancelCreateFile() {
    fileDialog.value?.hide()
}

watch(host, () => {

})

onMounted(() => {
    if (!fileDialogElem.value) {
        throw new Error("File modal not initialized")
    }
    fileDialog.value = new Modal(fileDialogElem.value)
    working.value = false
    refreshFiles()
})

</script>

<template>
    <div class="container my-2">
        <div class="row mt-3 mb-5">
            <div class="col-12">
                <h1 class="text-center">AP Puzzles</h1>
                <p class="text-center">
                    It's cool. Play it today.
                </p>
            </div>
        </div>
        <div class="row">
            <div class="col-12 align-center vstack">
                <RouterLink class="game-card card focus-ring mb-2 bg-primary" tabindex="0" :to="`/game/freeplay`">
                    <div class="card-body d-flex flex-row" role="button">
                        <div>
                            <h4>Freeplay</h4>
                        </div>
                        <div class="flex-fill"></div>
                    </div>
                </RouterLink>
                <div v-for="(file, id) of files" class="game-card card focus-ring mb-2">
                    <div class="card-body d-flex flex-row">
                        <RouterLink :to="`/game/${id}`" class="game-card-link flex-fill d-flex ">
                            <div>
                                <h4>{{ file.filename }}</h4>
                                <small>{{ file.host }}:{{ file.port }}</small>
                            </div>
                            <div class="flex-fill"></div>
                        </RouterLink>
                        <div class="hstack gap-1">
                            <RouterLink class="btn btn-primary" :to="`/game/${id}`">Open</RouterLink>
                            <button class="btn btn-secondary" @click.stop="editFile(file, id)">Edit</button>
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary btn-lg align-self-center mt-4" @click="showNewFileDialog">
                    <i class="bi bi-plus-lg" role="img"></i>
                    Connect
                </button>
            </div>
        </div>
    </div>
    <Teleport to="body">
        <div class="modal fade filedialog" tabindex="-1" ref="fileDialogElem">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 :id="`dialog-title-home`">
                            <span v-if="!existingFile">New File</span>
                            <span v-if="existingFile">Edit File</span>
                        </h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning" v-if="fileDialogError">
                            <strong>Error</strong>
                            <br>
                            <span>{{ fileDialogError }}</span>
                        </div>
                        <form novalidate :class="{'was-validated': fileDialogShowValidation}" ref="fileDialogForm">
                            <div class="mb-3">
                                <label :for="`dialog-control-host`" class="form-label">Host</label>
                                <input v-model="host" class="form-control" :id="`dialog-control-host`" required>
                            </div>
                            <div class="mb-3">
                                <label :for="`dialog-control-port`" class="form-label">Port number</label>
                                <input v-model="port" pattern="[0-9]*" class="form-control" :id="`dialog-control-port`" required>
                            </div>
                            <div class="mb-3">
                                <label :for="`dialog-control-player`" class="form-label">Player</label>
                                <input v-model="player" class="form-control" :id="`dialog-control-player`" required>
                            </div>
                            <div class="mb-3">
                                <label :for="`dialog-control-password`" class="form-label">Password (optional)</label>
                                <input v-model="password" type="password" class="form-control" :id="`dialog-control-password`">
                            </div>
                            <div class="mb-3">
                                <label :for="`dialog-control-password`" class="form-label">Filename (optional)</label>
                                <input v-model="filename" class="form-control" :id="`dialog-control-password`" :placeholder="existingFile ? '' : player">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button v-if="!existingFile" class="btn btn-primary" :disabled="working" @click="confirmCreateFile()">
                            <span v-if="working" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Connect
                        </button>
                        <button v-if="existingFile" class="btn btn-primary" :disabled="working" @click="updateFile()">
                            Save
                        </button>
                        <button v-if="existingFile" class="btn btn-danger" :disabled="working" @click="deleteFile()">
                            Delete
                        </button>
                        <button class="btn btn-secondary" :disabled="working" @click="cancelCreateFile()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade filedialog" tabindex="-1" ref="deleteDialogElem">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h1 :id="`dialog-title-home`">Delete File</h1>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>
                            Really delete file "`{{ selectedFile?.filename || "(unnamed)" }}`"?
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-danger" :disabled="working" @click="updateFile()">Delete</button>
                        <button class="btn btn-secondary" :disabled="working" @click="cancelCreateFile()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style lang="scss">
a.game-card, a.game-card-link {
    text-decoration: initial;
}

a.game-card-link {
    color: var(--bs-body-color);
}
</style>