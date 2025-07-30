<script setup lang="ts">
import { genreCollections, genreInfo, genres } from "@/genres";
import PuzzleContainer from "./PuzzleContainer.vue";
import { computed, inject, onMounted, reactive, ref, shallowRef, useId, useModel, useTemplateRef, watch, watchEffect } from "vue";
import { PuzzlesAPConnection, puzzlesAPConnectionKey } from "@/services/PuzzlesAPConnection";
import { GameModel } from "@/types/GameModel";
import { PuzzleData } from "@/types/PuzzleData";
import { PuzzleState } from "@/types/PuzzleState";
import PuzzleListEntry from "./PuzzleListEntry.vue";
import { useRoute } from "vue-router";
import { GameService, gameServiceKey } from "@/services/GameService";

const gameModel = defineModel<GameModel>()
const props = defineProps<{
    fileId: string,
    puzzle?: string
}>()

const route = useRoute()

const puzzleContainer = useTemplateRef("puzzleContainer")

const id = useId();

const connectionHost = ref("localhost")
const connectionPort = ref("38281")
const connectionPlayer = ref("Player1")

const errorText = ref("")

const apConnection = inject(puzzlesAPConnectionKey) as PuzzlesAPConnection
const gameService = inject(gameServiceKey) as GameService

const selectedPuzzle = ref<PuzzleData>()

const sortKeys = ref<string[]>(["status","number"])

const filters = ref({
    showLocked: true,
    showSolved: true
})

const sortedPuzzles = computed(() => {
    if (!gameModel.value?.puzzles) return []

    let puzzleList = gameModel.value.puzzles.slice()
    puzzleList = puzzleList.filter(e => {
        if (!filters.value.showLocked && e.locked) return false;
        if (!filters.value.showSolved && e.solved) return false;
        return true
    })
    puzzleList.sort((a,b) => {
        // Return a negative number if a comes before b
        // Return a positive number if a comes after b
        // Return 0 otherwise

        for (var sortKey of sortKeys.value) {
            switch (sortKey) {
            case "status":
                // Sort unlocked puzzles first
                if (a.locked < b.locked) return -1
                if (a.locked > b.locked) return 1

                // Then unsolved puzzles
                if (a.solved < b.solved) return -1
                if (a.solved > b.solved) return 1
                break;

            case "number":
                var key1: any = a.key
                var key2: any = b.key

                if (key1 !== undefined && !isNaN(+key1)) {
                    key1 = +key1
                }
                if (key2 !== undefined && !isNaN(+key2)) {
                    key2 = +key2
                }

                if (key1 === undefined || key2 === undefined) {
                    if (key1 !== undefined && key2 === undefined) return -1
                    if (key1 === undefined && key2 !== undefined) return 1
                } else {
                    if (key1 < key2) return -1
                    if (key1 > key2) return 1
                }
                break;

            case "genre":
                if (a.genre < b.genre) return -1
                if (a.genre > b.genre) return 1
                break;
            
            case "collection":
                var collectionA = genreInfo[a.genre].collection
                var collectionIndexA = genreCollections.findIndex(collection => collection.key == collectionA)
                var collectionB = genreInfo[b.genre].collection
                var collectionIndexB = genreCollections.findIndex(collection => collection.key == collectionB)

                if (collectionIndexA < collectionIndexB) return -1
                if (collectionIndexA > collectionIndexB) return 1
                break;
            }
        }

        return 0
    })

    return puzzleList
})

function updatePuzzle() {
    if (!gameModel.value) return;
    const newPuzzle = selectedPuzzle.value
    console.log(`Selected puzzle`, newPuzzle)

    if (!newPuzzle) {
        puzzleContainer.value?.switchPuzzle("none")
        return;
    }
    puzzleContainer.value?.switchPuzzle(newPuzzle.genre, newPuzzle.seed, !gameModel.value?.freeplay)
}

async function connect() {
    try {
        gameModel.value = (await apConnection.connectAP(connectionHost.value, +connectionPort.value, connectionPlayer.value)).value
    } catch (e) {
        console.error(e)
        apErrorCallback(e)
    }
    
    Object.assign(window, {apConnection: apConnection})
}

function apErrorCallback(message: any) {
    errorText.value = message.toString()
}

function onPuzzleSolved() {
    let puzzle = selectedPuzzle.value

    if (!puzzle) {
        console.warn("Solve called with no puzzle loaded")
        return;
    }

    puzzle.localSolved = true
}

watch(() => props.fileId, async () => {
    console.log(`Opened game view to ${props.fileId}`)
    gameModel.value = await gameService.loadGame(props.fileId)

    if (!gameModel.value) {
        console.warn(`Failed to load game ${props.fileId}`)
        //TODO inform user
    }

    if (gameModel.value && gameModel.value.freeplay) {
        sortKeys.value = ["collection", "number"]
    }
}, {immediate: true})

watchEffect(() => {
    console.log(`Switched to puzzle ${props.puzzle}`)
    if (props.puzzle !== undefined) {
        selectedPuzzle.value = gameModel.value?.puzzles.find(e => e.key == props.puzzle)

        //TODO handle locked puzzles reactively
        if (selectedPuzzle.value?.locked) {
            selectedPuzzle.value = new PuzzleData("none")
        }
    } else {
        const emptyPuzzle = new PuzzleData("none")
        selectedPuzzle.value = emptyPuzzle
    }
})

watch(selectedPuzzle, updatePuzzle)

onMounted(() => {
    updatePuzzle()
})
</script>

<template>
    <div>
        <div class="container content my-2">
            <div class="row">
                <div class="col-4">
                    <div class="sidebar" v-if="gameModel">
                        <!--form class="connection-info" @submit.prevent="connect">
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
                        </form-->
                        <div class="puzzlelist list-group list-group-flush">
                            <PuzzleListEntry v-for="puzzleEntry in sortedPuzzles" :puzzle="puzzleEntry" :selectedPuzzleKey="puzzle" :to="`/game/${fileId}/${puzzleEntry.key}`" :game-model="gameModel"/>
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
    height: calc(100vh - 2.5rem - 56px);
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