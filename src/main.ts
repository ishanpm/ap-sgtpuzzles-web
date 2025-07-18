import App from "./components/App.vue"
import { createApp } from "vue"
import { createPinia } from "pinia"
import { PuzzlesAPConnection, puzzlesAPConnectionKey } from "./services/PuzzlesAPConnection"
import { SaveService, saveServiceKey } from "./services/SaveService"
import router from "./router"

//const pinia = createPinia()
const app = createApp(App)
const apConnection = new PuzzlesAPConnection()
const saveService = new SaveService()

app.provide(puzzlesAPConnectionKey, apConnection)
app.provide(saveServiceKey, saveService)
//app.use(pinia)
app.use(router)
app.mount("#app")