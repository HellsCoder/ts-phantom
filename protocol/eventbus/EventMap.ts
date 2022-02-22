import { ConnectionID } from "../connection/ConnectionID";
import { ConnectResponse } from "../packet/handshake/PacketN2ConnectResponse";

/**
 * Карта ивентов. Какой ивент какого вида выдает калбек (нужна для автоподсказок IDE)
 */
export interface EventMap {
    "opponent_disconnect" : (id : ConnectionID) => void;
    "opponent_connect" : (id : ConnectionID) => void;
    "connect_process" : (id : ConnectionID, response : ConnectResponse) => void;
    "connect_discarded" : (id : ConnectionID) => void;
}