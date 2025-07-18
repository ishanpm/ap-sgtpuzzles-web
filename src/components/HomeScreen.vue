<script setup lang="ts">
import { genres } from '@/genres';
import { SaveService, saveServiceKey } from '@/services/SaveService';
import { GameModel } from '@/types/GameModel';
import { PuzzleData } from '@/types/PuzzleData';
import { inject, onMounted, ref } from 'vue';

const files = ref<GameModel[]>([])
const saveService = inject(saveServiceKey) as SaveService
const freeplayState = ref(getFreeplayPuzzleState())

defineEmits<{
    fileClick: [file: GameModel]
}>()

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

onMounted(refreshFiles)

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
                <RouterLink v-for="(file, index) of files" class="game-card card focus-ring mb-2" tabindex="0" :to="`/game/${file.filename}`">
                    <div class="card-body d-flex flex-row" role="button">
                        <div>
                            <h4>{{ file.filename }}</h4>
                            <small v-if="!file.freeplay">{{ file.host }}:{{ file.port }}</small>
                        </div>
                        <div class="flex-fill"></div>
                        <div class="hstack gap-1">
                            <RouterLink class="btn btn-primary" :to="`/game/${index}`">Open</RouterLink>
                            <a class="btn btn-secondary" href="#" @click.stop="console.log('wow')">Edit</a>
                        </div>
                    </div>
                </RouterLink>
                <button class="btn btn-primary btn-lg align-self-center mt-4">
                    <i class="bi bi-plus-lg" role="img"></i>
                    Connect
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
a.game-card {
    text-decoration: initial;
}
</style>