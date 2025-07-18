<script setup lang="ts">
import { GameModel } from '@/types/GameModel';
import Game from './Game.vue';
import { inject, onMounted, ref, shallowRef } from 'vue';
import { SaveService, saveServiceKey } from '@/services/SaveService';
import { type Component } from 'vue';
import HomeScreen from './HomeScreen.vue'
import { RouterLink, RouterView } from 'vue-router';

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
                <RouterLink class="navbar-brand" to="/">AP Puzzles</RouterLink>
            </div>
        </nav>
        <RouterView/>
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