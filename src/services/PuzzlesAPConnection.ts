import { GameModel } from "@/types/GameModel";
import { Client, ITEMS_HANDLING_FLAGS, type ConnectionInformation, type JSONSerializableData, type PrintJSONPacket, type ReceivedItemsPacket, type RetrievedPacket, type RoomUpdatePacket, type ServerPacket, type SetReplyPacket } from "archipelago.js"
import { reactive } from "vue";
import { PuzzleState } from "../types/PuzzleState";
import { PuzzleData, puzzleFromArchipelagoString } from "@/types/PuzzleData";

export class PuzzlesAPConnection {
    client: Client
    connected: boolean
    model: GameModel

    constructor() {
        this.client = new Client();
        this.connected = false
        this.model = reactive(new GameModel());
    }

    async connectAP(hostname: string, port: number, player: string, password?: string) {
        // TODO probably unnecessary to sync both due to ReceivedItems and RoomUpdate..?
        this.client.addListener("PacketReceived", this.logEvent.bind(this));
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

        this.connected = true;
        console.log("connected to AP");

        // Load puzzle data

        if (this.model.puzzles.length == 0) {
            let newPuzzles: PuzzleData[] = []
            let slotData = this.client.data.slotData

            if (typeof slotData.puzzles != "object" || !slotData.puzzles?.length) {
                throw new Error("Type assertion failed")
            }

            let puzzles = slotData.puzzles as JSONSerializableData[]

            for (let i = 0; i < puzzles.length; i++) {
                let puzzleString = puzzles[i]
                if (typeof puzzleString != "string") {
                    throw new Error("Type assertion failed")
                }

                let newPuzzle = puzzleFromArchipelagoString(puzzleString, "123", i, {})

                newPuzzles.push(newPuzzle)
            }

            this.model.puzzles = newPuzzles;
            console.log(newPuzzles)
        }
    }



    logEvent(packet: ServerPacket) {
        console.log(packet.cmd, packet)
    }

    onReceiveItems(packet: ReceivedItemsPacket) {

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