<script setup lang="ts">
import { type GenrePresetList, type GenrePresetElement } from '@/types/GenrePresetList';
import { ref, watch } from 'vue';

const presetList = defineModel<GenrePresetList>("presetList")
const currentPreset = defineModel<number>("currentPreset")
const currentMenu = ref(0)

const emit = defineEmits<{
    selected: [index: number]
}>()

watch(presetList, () => {
    currentMenu.value = 0
})

watch(currentPreset, console.log)

function selectPreset(index: number){
    console.log(index)
    emit("selected", index)
}

</script>

<template>
    <a class="dropdown">
        <button class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown">Type</button>
        <ul class="dropdown-menu preset-select scroll">
            <li v-if="!!presetList" v-for="entry in presetList[currentMenu]">
                <button v-if="entry.type == 'preset'" class="dropdown-item" :class="{active: currentPreset == entry.index}" @click="selectPreset(entry.index)">
                    {{ entry.title }}
                </button>
                <h6 v-if="entry.type == 'submenu'" class="dropdown-header">{{ entry.title }}</h6>
            </li>
        </ul>
    </a>
</template>

<style>
.preset-select {
    max-height: 30em;
}
</style>