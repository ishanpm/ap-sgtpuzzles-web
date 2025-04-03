<script setup lang="ts">
import { genreInfo, genres } from "@/genres";
import PuzzleContainer from "./PuzzleContainer.vue";
import { computed, inject, onMounted, reactive, ref, shallowRef, useId, useTemplateRef, watch } from "vue";
import { PuzzlesAPConnection, puzzlesAPConnectionKey } from "@/services/PuzzlesAPConnection";
import { GameModel } from "@/types/GameModel";
import { PuzzleData } from "@/types/PuzzleData";
import { PuzzleState } from "@/types/PuzzleState";

const puzzleContainer = useTemplateRef("puzzleContainer")

const id = useId();

const connectionHost = ref("localhost")
const connectionPort = ref("38281")
const connectionPlayer = ref("Player1")

const errorText = ref("")

const apConnection = inject(puzzlesAPConnectionKey) as PuzzlesAPConnection
const gameModel = computed(() => apConnection.connected.value ? apConnection.model.value : freeplayPuzzleState.value)

const selectedPuzzle = ref<PuzzleData>()

const sortedPuzzles = computed(() => {
    if (!gameModel.value.puzzles) return []

    let puzzleList = gameModel.value.puzzles.slice()
    puzzleList.sort((a,b) => {
        // Sort unlocked puzzles first
        if (a.locked < b.locked) return -1
        if (a.locked > b.locked) return 1

        // Then unsolved puzzles
        if (a.solved < b.solved) return -1
        if (a.solved > b.solved) return 1

        // Then sort by number
        if (a.index !== undefined && b.index !== undefined) {
            return a.index - b.index
        }

        return 0
    })

    return puzzleList
})

const freeplayPuzzleState = computed(() => {
    let puzzles = genres.map(g => {
        let puzzle = new PuzzleData(g)

        return puzzle
    })

    let gameModel = new GameModel()
    gameModel.freeplay = true
    gameModel.filename = "Freeplay"
    gameModel.puzzles = puzzles

    return gameModel
})

function connect() {
    if (apConnection) {
        // TOOO disconnect existing
    }

    apConnection.connectAP(connectionHost.value, +connectionPort.value, connectionPlayer.value)
    
    Object.assign(window, {apConnection: apConnection})
}

function apErrorCallback(message: any) {
    console.error("AP Error: ", message)
}

function onPuzzleSolved() {
    let puzzle = selectedPuzzle.value

    if (!puzzle) {
        console.warn("Solve called with no puzzle loaded")
        return;
    }

    puzzle.localSolved = true
    puzzle.solved = true //TODO handle this in PuzzlesAPConnection
}

watch(selectedPuzzle, (puzzle) => {
    if (!puzzle) {
        puzzleContainer.value?.switchPuzzle("none")
        return;
    }
    puzzleContainer.value?.switchPuzzle(puzzle.genre, puzzle.seed, !gameModel.value.freeplay)
})

watch(gameModel, () => {
    selectedPuzzle.value = undefined;
})

onMounted(() => {
    puzzleContainer.value?.switchPuzzle("none")
})
</script>

<template>
    <div>
        <nav class="navbar sticky-top navbar-expand-lg bg-body-tertiary">
            <div class="container-fluid">
                <a class="navbar-brand" href="#">AP Puzzles</a>
            </div>
        </nav>
        <div class="container content">
            <div class="row">
                <div class="col-4">
                    <div class="sidebar">
                        <form class="connection-info" @submit.prevent="connect">
                            <div class="mb-3">
                                <label :for="`connection-host-${id}`" class="form-label">Host</label>
                                <input v-model="connectionHost" class="form-control" :id="`connection-host-${id}`">
                            </div>
                            <div class="mb-3">
                                <label :for="`connection-port-${id}`" class="form-label">Port</label>
                                <input inputmode="numeric" v-model="connectionPort" class="form-control" :id="`connection-port-${id}`">
                            </div>
                            <div class="mb-3">
                                <label :for="`connection-player-${id}`" class="form-label">Player</label>
                                <input v-model="connectionPlayer" class="form-control" :id="`connection-player-${id}`">
                            </div>
                            <button type="submit" class="btn btn-primary">Connect</button>
                        </form>
                        <div class="puzzlelist list-group list-group-flush">
                            <a v-for="(puzzle, index) in sortedPuzzles"
                                    class="list-group-item"
                                    :class="{'active': puzzle == selectedPuzzle, 'disabled': puzzle.locked}"
                                    href="#"
                                    @click="selectedPuzzle=puzzle">
                                {{ puzzle.index }}{{ puzzle.index ? ": " : "" }}{{ genreInfo[puzzle.genre].name }}
                            </a>
                        </div>
                    </div>
                </div>
                <div class="col-8 main">
                    <PuzzleContainer ref="puzzleContainer" @solved="onPuzzleSolved()"/>
                    <div class="filler tall">Puzzle info</div>
                </div>
            </div>
        </div>
    </div>
    <Teleport to="#toast-container">
        <div ref="errorToastElem" data-bs-autohide="false" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Connection Error</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                {{ errorText }}
            </div>
        </div>
    </Teleport>
</template>

<style lang="scss">
.filler {
    border: 2px dashed #ddd;
    background-color: #eee;
    border-radius: 4px;
    color: #aaa;
    font-size: larger;
    padding: 1em;
}

[data-bs-theme=dark] .filler {
    border-color: #6e6e6e;
    background-color: #353535;
    color: #868686;
}

.sidebar {
    position: sticky;
    height: calc(100vh - 2rem - 56px);
    width: 100%;
    display: flex;
    flex-direction: column;
    top: calc(1rem + 56px);
    margin-top: 1rem;
}

.puzzlelist {
    flex: 1;
    z-index: 1;
    overflow-y: scroll;
    border-radius: var(--bs-border-radius);
    border: var(--bs-list-group-border-width) solid var(--bs-list-group-border-color);;
}

.tall {
    height: 1000px;
    width: 100%;
}
</style>