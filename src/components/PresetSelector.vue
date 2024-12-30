<script setup lang="ts">
import { type GenrePresetList, type GenrePresetElement } from '@/types/GenrePresetList';
import { Dropdown } from 'bootstrap';
import { onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch, watchEffect } from 'vue';

const presetList = defineModel<GenrePresetList>("presetList")
const currentPreset = defineModel<number>("currentPreset")
const presetDropdownElem = useTemplateRef("presetDropdownElem")
const presetDropdown = shallowRef<Dropdown>()

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

function updateDropdown() {
    presetDropdown.value?.update()
}

onMounted(() => {
    if (!presetDropdownElem.value) {
        throw new Error("Preset dropdown not present")
    }

    presetDropdown.value = new Dropdown(presetDropdownElem.value)

    presetDropdownElem.value.addEventListener("hidden.bs.dropdown", (_event) => {
        breadcrumb.value = [0];
    })
})

</script>

<template>
    <a class="dropdown" ref="presetDropdownElem">
        <button class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown">Type</button>
        <ul v-if="presetList !== undefined" class="dropdown-menu preset-select scroll">
            <li v-if="breadcrumb.length > 0">
                <h5 class="dropdown-header">
                    <template v-for="(menuId, index) in breadcrumb">
                        <template v-if="index < breadcrumb.length-1">
                            <a href="#" @click.stop="breadcrumb.splice(index+1); updateDropdown()">{{ presetList?.[menuId]?.title }}</a> &gt; 
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
                <button v-if="entry.type == 'submenu'" class="dropdown-item submenu" @click.stop="breadcrumb.push(entry.index); updateDropdown()">
                    {{ entry.title }}
                    <i class="bi bi-chevron-right" aria-hidden="true"></i>
                </button>
            </li>
        </ul>
    </a>
</template>

<style lang="scss">
.preset-select {
    max-height: 32em;
    overflow-y: auto;
}

.preset-select .submenu {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
</style>