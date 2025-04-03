import { GameModel } from "@/types/GameModel";
import { Client, ITEMS_HANDLING_FLAGS, type ConnectedPacket, type ConnectionInformation, type DataPackage, type GamePackage, type JSONSerializableData, type PrintJSONPacket, type ReceivedItemsPacket, type RetrievedPacket, type RoomInfoPacket, type RoomUpdatePacket, type ServerPacket, type SetReplyPacket } from "archipelago.js"
import { reactive, ref, watch, type InjectionKey, type Ref, type WatchHandle } from "vue";
import { PuzzleState } from "../types/PuzzleState";
import { PuzzleData, puzzleFromArchipelagoString } from "@/types/PuzzleData";
import { isAPSlotData, type APSlotData } from "@/types/APSlotData";

const baseId = 9250000
const gameName = "Simon Tatham's Portable Puzzle Collection"

export const puzzlesAPConnectionKey = Symbol() as InjectionKey<PuzzlesAPConnection>

export class PuzzlesAPConnection {
    client: Client
    connected: Ref<boolean>
    model: Ref<GameModel>
    gamePackage: GamePackage | undefined
    watchers: WatchHandle[] = []

    constructor() {
        this.client = new Client();
        this.connected = ref(false)
        this.model = ref(new GameModel());
    }

    async connectAP(hostname: string, port: number, player: string, password?: string) {
        this.connected.value = false

        this.client.addListener("PacketReceived", this.logEvent.bind(this));
        this.client.addListener("Connected", this.onConnected.bind(this))
        this.client.addListener("ReceivedItems", this.onReceiveItems.bind(this));
        this.client.addListener("RoomUpdate", this.syncAPStatus.bind(this));
        this.client.addListener("PrintJSON", this.onPrintJson.bind(this))
        this.client.addListener("SetReply", this.onSetReply.bind(this))
        this.client.addListener("Retrieved", this.onKeysRetreived.bind(this))

        console.log("connecting to AP...");

        const connectionInfo: ConnectionInformation = {
            hostname: hostname,
            port: port,
            game: "Simon Tatham's Portable Puzzle Collection",
            name: player,
            password: password,
            items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        };

        await this.client.connect(connectionInfo);

        this.connected.value = true;
        console.log("connected to AP");
    }

    clearWatchers() {
        for (let watcher of this.watchers) {
            watcher.stop()
        }
    }

    getGamePackage() {
        if (!this.gamePackage) {
            this.gamePackage = this.client.data.package.get(gameName)

            if (!this.gamePackage) {
                throw new Error("Failed to retrieve game package")
            }
        }
        return this.gamePackage
    }

    logEvent(packet: ServerPacket) {
        console.log(packet.cmd, packet)
    }

    onPuzzleSolved() {

    }

    onConnected(packet: ConnectedPacket) {
        // Load puzzle data
        const gamePackage = this.getGamePackage()
        const slotData = packet.slot_data
        
        if (!isAPSlotData(slotData)) {
            throw new Error("Invalid slot data from Archipelago")
        }

        this.model.value = new GameModel()

        let newPuzzles: PuzzleData[] = []

        let puzzles = slotData.puzzles

        for (let i = 0; i < puzzles.length; i++) {
            let puzzleString = puzzles[i]

            let puzzleOptions = {
                locked: true,
                items: []
            }
            let newPuzzle = puzzleFromArchipelagoString(puzzleString, ""+slotData.world_seed, i+1, puzzleOptions)

            newPuzzles.push(newPuzzle)
        }

        this.model.value.puzzles = newPuzzles;
    }

    onReceiveItems(packet: ReceivedItemsPacket) {
        const gamePackage = this.getGamePackage()

        for (let item of packet.items) {
            let itemName = gamePackage.item_id_to_name[item.item]

            const puzzleItemRegex = /Puzzle (\d+)/
            let puzzleItemMatch = puzzleItemRegex.exec(itemName)

            if (puzzleItemMatch) {
                let index = +puzzleItemMatch[1] - 1
                console.log(index)
                this.model.value.puzzles[index].locked = false
            }
        }
    }

    syncAPStatus(packet: RoomUpdatePacket) {

    }

    onPrintJson(packet: PrintJSONPacket, message: string) {

    }

    onSetReply(packet: SetReplyPacket) {

    }

    onKeysRetreived(packet: RetrievedPacket) {

    }
}