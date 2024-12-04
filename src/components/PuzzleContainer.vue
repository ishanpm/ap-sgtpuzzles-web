<script setup lang="ts">
import { ref, useId, useTemplateRef } from 'vue';
import PuzzleViewer from './PuzzleViewer.vue';
import type { GenrePresetList } from '@/types/GenrePresetList';
import PresetSelector from './PresetSelector.vue';

const puzzleViewer = useTemplateRef("puzzleViewer")

const presetList = ref<GenrePresetList>()
const currentPreset = ref(0)

</script>

<template>
    <div>
        <div class="puzzle-controls">
            <a class="dropdown">
                <button class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown">Game</button>
                <ul class="dropdown-menu">
                    <li><button class="dropdown-item" @click="puzzleViewer?.newPuzzle()">New</button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item" disabled="true">Enter game ID...</button></li>
                    <li><button class="dropdown-item" disabled="true">Enter random seed...</button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item" href="#" @click="puzzleViewer?.showPreferences()">Preferences for puzzleName...</button></li>
                </ul>
            </a>
            <PresetSelector v-model:preset-list="presetList" v-model:current-preset="currentPreset" @selected="(index) => puzzleViewer?.selectPreset(index)"/>
        </div>
        <PuzzleViewer ref="puzzleViewer" v-model:preset-list="presetList" v-model:current-preset="currentPreset"/>
    </div>
</template>

<style>
.puzzle-controls {
    display: flex;
    gap: 4px;
    padding-top: 0.2em;
    padding-bottom: 0.2em;
}
</style>