import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import HomeScreen from "./components/HomeScreen.vue";
import Game from "./components/Game.vue";
import PuzzleContainer from "./components/PuzzleContainer.vue";

const gameRoutes: RouteRecordRaw[] = [
    {path: ":puzzleId", component: PuzzleContainer}
]

const routes: RouteRecordRaw[] = [
    {path: "/", component: HomeScreen},
    {path: "/game/:fileId", component: Game, props: true},
    {path: "/game/:fileId/:puzzle", component: Game, props: true}
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router