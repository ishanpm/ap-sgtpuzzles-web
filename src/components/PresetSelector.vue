<script setup lang="ts">
import { type GenrePresetList, type GenrePresetElement } from '@/types/GenrePresetList';
import { onMounted, onUnmounted, ref, useTemplateRef, watch, watchEffect } from 'vue';

const presetList = defineModel<GenrePresetList>("presetList")
const currentPreset = defineModel<number>("currentPreset")
const presetDropdown = useTemplateRef("presetDropdown")

const currentMenu = ref(0)
const breadcrumb = ref([0])

const emit = defineEmits<{
    selected: [index: number]
}>()

watch(presetList, () => {
    breadcrumb.value = [0]
})

watchEffect(() => {
    currentMenu.value = breadcrumb.value[breadcrumb.value.length-1]
})

function selectPreset(index: number){
    emit("selected", index)
}

onMounted(() => {
    if (!presetDropdown.value) {
        throw new Error("Preset dropdown not present")
    }

    presetDropdown.value.addEventListener("hidden.bs.dropdown", (event) => {
        breadcrumb.value = [0];
    })
})

</script>

<template>
    <a class="dropdown" ref="presetDropdown">
        <button class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown">Type</button>
        <ul class="dropdown-menu preset-select scroll">
            <li v-if="breadcrumb.length > 1">
                <button class="dropdown-item" @click.stop="breadcrumb.pop()">
                    Back
                </button>
            </li>
            <li v-if="breadcrumb.length > 1">
                <hr class="dropdown-divider">
            </li>
            <li v-if="!!presetList" v-for="entry in presetList[currentMenu]">
                <button v-if="entry.type == 'preset'"
                        class="dropdown-item"
                        :class="{active: currentPreset == entry.index}"
                        @click="selectPreset(entry.index)">
                    {{ entry.title }}
                </button>
                <button v-if="entry.type == 'submenu'" class="dropdown-item submenu" @click.stop="(e) => breadcrumb.push(entry.index)">
                    {{ entry.title }}
                </button>
            </li>
        </ul>
    </a>
</template>

<style lang="scss">
.preset-select {
    max-height: 30em;
    overflow-y: auto;
}

.preset-select .submenu::after {
    display: inline-block;
    margin-left: 0.255em;
    right: 0.255em;
    vertical-align: 0.255em;
    content: "";
    border-top: 0.3em solid transparent;
    border-right: 0;
    border-bottom: 0.3em solid transparent;
    border-left: 0.3em solid;
}
</style>