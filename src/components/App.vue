<script setup lang="ts">
import { GameModel } from '@/types/GameModel';
import Game from './Game.vue';
import { inject, onMounted, ref, shallowRef } from 'vue';
import { SaveService, saveServiceKey } from '@/services/SaveService';
import { type Component } from 'vue';
import HomeScreen from './HomeScreen.vue'

const currentView = ref("home")
const gameModel = ref<GameModel>()


function loadFile(file: GameModel) {
    currentView.value = "game"
    gameModel.value = file
}

</script>

<template>
    <div class="min-vh-100 d-flex flex-column">
        <nav class="navbar sticky-top navbar-expand-lg bg-body-tertiary">
            <div class="container-fluid">
                <a class="navbar-brand" href="#" @click="currentView='home'">AP Puzzles</a>
            </div>
        </nav>
        <HomeScreen v-if="currentView=='home'" @file-click="loadFile"/>
        <Game v-if="currentView=='game'" v-model="gameModel"/>
        <div class="flex-fill"></div>
        <div class="footer bg-body-tertiary mt-5">
        </div>
    </div>
</template>

<style lang="scss">
.footer {
    width: 100%;
    min-height: 15em;
}
</style>