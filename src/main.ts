import App from "./components/App.vue"
import { createApp } from "vue"
import { createPinia } from "pinia"
import { PuzzlesAPConnection, puzzlesAPConnectionKey } from "./services/PuzzlesAPConnection"
import { SaveService, saveServiceKey } from "./services/SaveService"
import router from "./router"
import { GameService, gameServiceKey } from "./services/GameService"

//const pinia = createPinia()
const app = createApp(App)
const apConnection = new PuzzlesAPConnection()
const saveService = new SaveService()
const gameService = new GameService(apConnection, saveService)

app.provide(puzzlesAPConnectionKey, apConnection)
app.provide(saveServiceKey, saveService)
app.provide(gameServiceKey, gameService)
//app.use(pinia)
app.use(router)
app.mount("#app")