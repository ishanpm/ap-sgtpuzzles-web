import { PuzzleData } from "@/types/PuzzleData";
import { Client, ITEMS_HANDLING_FLAGS, type ConnectionInformation, type PrintJSONPacket, type ReceivedItemsPacket, type RetrievedPacket, type RoomUpdatePacket, type ServerPacket, type SetReplyPacket } from "archipelago.js";
import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";

export const useAPStore = defineStore("APStore", () => {
    const client = shallowRef<Client>(new Client())
    const active = ref(false)
    const puzzleDefinitions = ref<PuzzleData[]>([])

    async function connect(hostname: string, port: number, player: string, password: string) {
        client.value.addListener("PacketReceived", logEvent);
        client.value.addListener("ReceivedItems", onReceiveItems);
        client.value.addListener("RoomUpdate", onRoomUpdate);
        client.value.addListener("PrintJSON", onPrintJson)
        client.value.addListener("SetReply", onSetReply)
        client.value.addListener("Retrieved", onKeysRetreived)

        console.log("connecting to AP...");

        const connectionInfo: ConnectionInformation = {
            hostname: hostname,
            port: port,
            game: "Simon Tatham's Portable Puzzle Collection",
            name: player,
            password: password,
            items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        };

        await client.value.connect(connectionInfo)
    }

    function syncAPStatus() {
        
    }

    function logEvent(packet: ServerPacket) {
        console.log(packet.cmd, packet)
    }

    function onReceiveItems(packet: ReceivedItemsPacket) {

    }

    function onRoomUpdate(packet: RoomUpdatePacket) {
        
    }

    function onPrintJson(packet: PrintJSONPacket, message: string) {
        
    }

    function onSetReply(packet: SetReplyPacket) {

    }

    function onKeysRetreived(packet: RetrievedPacket) {

    }

    return {
        client,
        puzzleDefinitions,
        connect,
        syncAPStatus,
        logEvent,
        onReceiveItems,
        onRoomUpdate,
        onPrintJson,
        onSetReply,
        onKeysRetreived
    }
})