<script setup lang="ts">
import { GameModel } from '@/types/GameModel';
import Game from './Game.vue';
import { inject, onMounted, ref } from 'vue';
import { SaveService, saveServiceKey } from '@/services/SaveService';

const saveService = inject(saveServiceKey) as SaveService
const fileList = ref<GameModel[]>([])

async function loadFileList() {
    fileList.value = await saveService.getFileList()
}

onMounted(() => loadFileList())

</script>

<template>
    <div>
        <nav class="navbar sticky-top navbar-expand-lg bg-body-tertiary">
            <div class="container-fluid">
                <a class="navbar-brand" href="#">AP Puzzles</a>
            </div>
        </nav>
    </div>
    <Game/>
</template>

<style lang="scss">
</style>