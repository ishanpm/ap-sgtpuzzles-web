<script setup lang="ts">
import { onMounted, ref, shallowRef, useTemplateRef, watch, watchEffect } from 'vue';
import PuzzleViewer from './PuzzleViewer.vue';
import PresetSelector from './PresetSelector.vue';
import { genreInfo, genres, type GenreKey } from '@/genres';
import type { PuzzleState } from '@/types/PuzzleState';
import { Tooltip } from 'bootstrap';

const puzzleViewer = useTemplateRef("puzzleViewer")
const paramsLink = useTemplateRef("paramsLink")

const paramsLinkTooltip = shallowRef<Tooltip>()
const debugGenre = ref<GenreKey>("none")
const debugId = ref("")
const puzzleState = ref<PuzzleState>()
const paramsCopied = ref(false)

let paramsCopiedFadeTimeout: number;

defineExpose({
    switchPuzzle
})

function switchPuzzle(genre: GenreKey, seedOrId?: string, singleMode?: boolean) {
    if (!puzzleViewer.value) {
        console.warn("Puzzle viewer not initialized to switch puzzle")
    }
    puzzleViewer.value?.switchPuzzle(genre, seedOrId, singleMode)
}

function updatePuzzleState(value: PuzzleState) {
    puzzleState.value = value;
}

function copyParams() {
    if (puzzleState.value?.params) {
        navigator.clipboard.writeText(puzzleState.value.params)
    }
    paramsCopied.value = true;
    paramsLink.value?.blur()

    paramsCopiedFadeTimeout = setTimeout(() => paramsCopied.value = false, 2000)
}

watch(() => puzzleState.value?.params, () => {
    clearTimeout(paramsCopiedFadeTimeout);
    paramsCopied.value = false
})

watch(paramsCopied, (newParamsCopied) => {
    let newContent = newParamsCopied ? "Copied!" : "Copy to clipboard"
    paramsLinkTooltip.value?.setContent({".tooltip-inner": newContent})
})

onMounted(() => {
    if (!paramsLink.value) {
        throw new Error("Params link not initialized")
    }

    paramsLinkTooltip.value = new Tooltip(paramsLink.value)
})

</script>

<template>
    <div>
        <h2 v-if="puzzleState">{{ genreInfo[puzzleState.genre].name }}</h2>
        <div :class="{hidden: !puzzleState?.params}">
            Parameters: <a
                    href="#"
                    ref="paramsLink"
                    @click="copyParams()"
                    class="icon-link"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    data-bs-title="Copy to clipboard">
                {{ puzzleState?.params }}
                <i class="bi" :class="paramsCopied ? 'bi-clipboard-check-fill' : 'bi-clipboard'"></i>
            </a>
        </div>
        <div class="puzzle-controls" v-if="puzzleState && puzzleState.genre != 'none'">
            <a class="dropdown">
                <button class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown">Game</button>
                <ul class="dropdown-menu">
                    <li><button class="dropdown-item" @click="puzzleViewer?.newPuzzle()">New</button></li>
                    <li><button class="dropdown-item" @click="puzzleViewer?.restartPuzzle()">Restart</button></li>
                    <li><button class="dropdown-item" @click="puzzleViewer?.solve()" v-if="puzzleState?.canSolve">Solve</button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item" @click="puzzleViewer?.puzzleFromId()">Enter game ID...</button></li>
                    <li><button class="dropdown-item" @click="puzzleViewer?.puzzleFromSeed()">Enter random seed...</button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item" disabled="true">Load from file...</button></li>
                    <li><button class="dropdown-item" disabled="true">Save to file...</button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item" href="#" @click="puzzleViewer?.showPreferences()">Preferences for {{ genreInfo[puzzleState.genre].name }}...</button></li>
                </ul>
            </a>
            <PresetSelector
                    v-model:preset-list="puzzleState.presets"
                    v-model:current-preset="puzzleState.currentPreset"
                    @selected="(index) => puzzleViewer?.selectPreset(index)"/>
            <div class="btn-group">
                <button class="btn btn-secondary" @click="puzzleViewer?.undo()" :disabled="!(puzzleState?.canUndo)">Undo</button>
                <button class="btn btn-secondary" @click="puzzleViewer?.redo()" :disabled="!(puzzleState?.canRedo)">Redo</button>
            </div>
        </div>
        <div class="puzzle-inner-container rounded bg-secondary-subtle">
            <PuzzleViewer ref="puzzleViewer" @update-puzzle-state="updatePuzzleState"/>
            <div class="puzzle-status" v-if="puzzleState?.statusMessage !== undefined">
                {{ puzzleState.statusMessage }}
            </div>
        </div>
    </div>
</template>

<style>
.puzzle-controls {
    display: flex;
    gap: 4px;
    padding-top: 0.2em;
    padding-bottom: 0.2em;
}

.puzzle-inner-container {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    margin: 1em 0;
}

.puzzle-status {
    margin: 0.5em;
    width: 100%;
}

.hidden {
    visibility: hidden !important;
}
</style>