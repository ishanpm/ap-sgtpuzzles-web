import App from "./components/App.vue"
import { createApp } from "vue"
import { createPinia } from "pinia"
import { PuzzlesAPConnection, puzzlesAPConnectionKey } from "./services/PuzzlesAPConnection"

const pinia = createPinia()
const app = createApp(App)
const apConnection = new PuzzlesAPConnection()

app.provide(puzzlesAPConnectionKey, apConnection)
app.use(pinia)
app.mount("#app")