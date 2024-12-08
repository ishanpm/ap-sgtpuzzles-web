<script setup lang="ts">
import { genreInfo, genres } from "@/genres";
import PuzzleContainer from "./PuzzleContainer.vue";
import { onMounted, ref, useTemplateRef } from "vue";

const puzzleContainer = useTemplateRef("puzzleContainer")

const selectedIndex = ref(0)

onMounted(() => {
    puzzleContainer.value?.switchPuzzle(genres[0])
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
                    <div class="puzzlelist list-group list-group-flush">
                        <a v-for="(genre, index) in genres"
                                class="list-group-item"
                                :class="{'active': index == selectedIndex}"
                                href="#"
                                @click="selectedIndex=index; puzzleContainer?.switchPuzzle(genre)">
                            {{ genreInfo[genre].name }}
                        </a>
                    </div>
                </div>
                <div class="col-8 main">
                    <PuzzleContainer ref="puzzleContainer"/>
                    <div class="filler tall">Puzzle info</div>
                </div>
            </div>
        </div>
    </div>
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

.puzzlelist {
    position: sticky;
    height: calc(100vh - 2rem - 56px);
    width: 100%;
    z-index: 1;
    top: calc(1rem + 56px);
    margin-top: 1rem;
    overflow-y: scroll;
    border-radius: var(--bs-border-radius);
    border: var(--bs-list-group-border-width) solid var(--bs-list-group-border-color);;
}

.tall {
    height: 1000px;
    width: 100%;
}
</style>