import { GameModel } from "@/types/GameModel";
import { type ConnectionOptions, Client, type ConnectedPacket, type ReceivedItemsPacket, type RetrievedPacket, type RoomUpdatePacket, type ServerPacket, type SetReplyPacket, PackageMetadata, type MessageNode, type InvalidPacketPacket } from "archipelago.js"
import { reactive, ref, toHandlers, watch, type InjectionKey, type Ref, type WatchHandle } from "vue";
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
    gamePackage: PackageMetadata | undefined
    watchers: WatchHandle[] = []

    constructor() {
        this.client = new Client();
        this.connected = ref(false)
        this.model = ref(new GameModel());

        this.client.socket.on("connected", this.onConnected.bind(this))
        this.client.socket.on("sentPackets", (packets =>console.log(packets)))
        this.client.socket.on("disconnected", () => console.log("Disconnect"))
        this.client.socket.on("receivedPacket", this.logEvent.bind(this));
        this.client.socket.on("receivedItems", this.onReceivedItems.bind(this));
        this.client.socket.on("roomUpdate", this.syncAPStatus.bind(this));
        this.client.socket.on("setReply", this.onSetReply.bind(this))
        this.client.socket.on("retrieved", this.onKeysRetreived.bind(this))
        this.client.socket.on("invalidPacket", this.onInvalidPacket.bind(this))
        this.client.messages.on("message", this.onMessage.bind(this))
    }

    async connectAP(hostname: string, port: number, player: string, password?: string) {
        this.client.socket.disconnect()
        this.connected.value = false

        this.clearWatchers()

        console.log("connecting to AP...");

        let connectionInfo: ConnectionOptions = {
            password: password ?? ""
        };

        let connectionURL = `${hostname}:${port}`

        await this.client.login(connectionURL, player, gameName, connectionInfo);

        console.log("connected to AP");

        let solvesKey = `sgtpuzzles_solves_${this.client.players.self.slot}`

        this.client.storage.notify([solvesKey], (key, value, oldValue) => {
            this.onRemoteSolvedChange(value)
        })

        let currentSolves = await this.client.storage.fetch([solvesKey])

        this.onRemoteSolvedChange(currentSolves[solvesKey])

        this.connected.value = true;
    }

    clearWatchers() {
        for (let watcher of this.watchers) {
            watcher.stop()
        }
    }

    getGamePackage() {
        if (!this.gamePackage) {
            this.gamePackage = this.client.package.findPackage(gameName) ?? undefined

            if (!this.gamePackage) {
                throw new Error("Failed to retrieve game package")
            }
        }
        return this.gamePackage
    }

    logEvent(packet: ServerPacket) {
        console.log(packet.cmd, packet)
    }

    onConnected(packet: ConnectedPacket) {
        // Load puzzle data
        const gamePackage = this.getGamePackage()
        const slotData = packet.slot_data
        
        if (!isAPSlotData(slotData)) {
            console.log("Slot data failed to type match:", slotData)
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

        for (let i = 0; i < puzzles.length; i++) {
            let watcher = watch(() => this.model.value.puzzles[i].localSolved, (localSolved) => {
                if (localSolved) {
                    this.onPuzzleSolved(this.model.value.puzzles[i])
                }
            })

            this.watchers.push(watcher)
        }
    }

    onDisconnected() {
        this.connected.value = false
    }

    onPuzzleSolved(puzzle: PuzzleData) {
        console.log("yay")

        const gamePackage = this.getGamePackage()

        let toCheck: number[] = []

        toCheck.push(gamePackage.locationTable[`Puzzle ${puzzle.index} Reward`])

        for (let i = 1; i < 3; i++) {
            toCheck.push(gamePackage.locationTable[`Puzzle ${puzzle.index} Reward ${i}`])
        }

        this.client.check(...toCheck)

        this.client.storage.prepare(`sgtpuzzles_solves_${this.client.players.self.slot}`, {})
            .update({[puzzle.index]: 1})
            .commit()
    }

    onRemoteSolvedChange(remoteSolves: any) {
        console.log(remoteSolves)
        for (let key in remoteSolves) {
            let index = +key
            let puzzle = this.model.value.puzzles[index-1]

            if (puzzle) {
                puzzle.solved = true
            }
        }
    }

    onReceivedItems(packet: ReceivedItemsPacket) {
        const gamePackage = this.getGamePackage()

        for (let item of packet.items) {
            let itemName = gamePackage.reverseItemTable[item.item]

            const puzzleItemRegex = /Puzzle (\d+)/
            let puzzleItemMatch = puzzleItemRegex.exec(itemName)

            if (puzzleItemMatch) {
                let index = +puzzleItemMatch[1] - 1
                this.model.value.puzzles[index].locked = false
            }
        }
    }

    syncAPStatus(packet: RoomUpdatePacket) {

    }

    onMessage(message: string, nodes: MessageNode[]) {
        console.log(message, nodes)
    }

    onSetReply(packet: SetReplyPacket) {

    }

    onKeysRetreived(packet: RetrievedPacket) {

    }

    onInvalidPacket(packet: InvalidPacketPacket) {
        console.error("Invalid packet sent to Archipelago", packet)
    }
}