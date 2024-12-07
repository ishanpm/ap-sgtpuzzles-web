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
        <ul v-if="presetList !== undefined" class="dropdown-menu preset-select scroll">
            <li v-if="breadcrumb.length > 0">
                <h5 class="dropdown-header">
                    <template v-for="(menuId, index) in breadcrumb">
                        <template v-if="index < breadcrumb.length-1">
                            <a href="#" @click.stop="breadcrumb.splice(index+1)">{{ presetList?.[menuId]?.title }}</a> &gt; 
                        </template>
                        <span v-if="index == breadcrumb.length-1">{{ presetList?.[menuId]?.title }}</span>
                    </template>
                </h5>
            </li>
            <li v-for="entry in presetList[currentMenu]?.entries">
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