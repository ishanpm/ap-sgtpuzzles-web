<script setup lang="ts">
import PuzzleContainer from "./PuzzleContainer.vue";

</script>

<template>
    <div>
        <nav class="navbar navbar-expand-lg bg-body-tertiary">
            <div class="container-fluid">
                <a class="navbar-brand" href="#">AP Puzzles</a>
            </div>
        </nav>
        <div class="container content">
            <div class="row">
                <div class="col-4">
                    <div class="filler puzzlelist sticky-top">Puzzle list</div>
                </div>
                <div class="col-8 main">
                    <PuzzleContainer />
                    <div class="filler tall"> Puzzle info</div>
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

.puzzlelist {
    height: 100vh;
    width: 100%;
    z-index: 1;
}

.tall {
    height: 1000px;
    width: 100%;
}
</style>