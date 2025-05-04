<script setup lang="ts">
import { genreInfo } from '@/genres';
import { GameModel } from '@/types/GameModel';
import { PuzzleData } from '@/types/PuzzleData';
import { computed } from 'vue';

defineEmits<{
    click: [payload: MouseEvent]
}>()

const props = defineProps<{
    puzzle: PuzzleData,
    selectedPuzzle?: PuzzleData
    gameModel: GameModel
}>()

const status = computed(() => {
    if (props.gameModel.freeplay) {
        return "unsolved"
    } else if (props.puzzle.solved && props.puzzle.localSolved) {
        return "solved"
    } else if (props.puzzle.solved && !props.puzzle.localSolved) {
        return "remote-solved"
    } else if (props.puzzle.localSolved && !props.puzzle.solved) {
        return "local-solved"
    } else if (props.puzzle.skipped) {
        return "skipped"
    } else if (props.puzzle.locked) {
        return "locked"
    } else {
        return "unsolved"
    }
})

</script>

<template>
    <a class="list-group-item puzzle-list-item"
            :class="{'active': puzzle.index == selectedPuzzle?.index, 'disabled': puzzle.locked, [status]: !gameModel.freeplay}"
            href="#"
            @click="payload => $emit('click', payload)">
        <div class="d-flex">
            <div v-if="!gameModel.freeplay" class="puzzle-status-icon align-self-center me-1">
                <i v-if="status == 'locked'" class="bi bi-lock" role="img" title="Locked"></i>
                <i v-if="status == 'solved'" class="bi bi-check-lg" role="img" title="Solved"></i>
                <i v-if="status == 'remote-solved'" class="bi bi-cloud-check" role="img" title="Solved remotely"></i>
                <i v-if="status == 'local-solved'" class="bi bi-send-check" role="img" title="Pending"></i>
                <i v-if="status == 'skipped'" class="bi bi-skip-end" role="img" title="Skipped"></i>
            </div>
            <div class="align-self-stretch flex-fill">
                <div class="flex-fill d-flex w-100 justify-content-between">
                    <h5 class="mb-1">{{ genreInfo[puzzle.genre].name }}</h5>
                    <small v-if="!gameModel.freeplay" class="">#{{ puzzle.index }}</small>
                </div>

                <p v-if="!gameModel.freeplay" class="mb-1">{{ puzzle.params }}</p>
            </div>
        </div>
    </a>
</template>

<style lang="scss">
.puzzle-status-icon {
    font-size: 120%;
    width: 1em;
    position: relative;
    left: -0.3em;
}

.puzzle-list-item:not(.active) {
    // &.locked {
    //     background: linear-gradient(135deg, transparent 0.8em, 0%, var(--bs-secondary-color) 1em, 0%, transparent);
    // }
    // &.unsolved {
    //     background: linear-gradient(135deg, var(--bs-emphasis-color) 1em, 0%, transparent);
    // }
    &.solved, &.remote-solved {
        background: linear-gradient(135deg, var(--bs-success) 1em, 0%, transparent);
    }
    &.local-solved {
        background: linear-gradient(135deg, var(--bs-info) 1em, 0%, transparent);
    }
    &.skipped {
        background: linear-gradient(135deg, var(--bs-warning) 1em, 0%, transparent);
    }
}
</style>