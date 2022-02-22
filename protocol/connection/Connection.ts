import { WebSocket } from "ws";
import { ConnectionID } from "./ConnectionID";

export interface Connection {
    socket: WebSocket;
    id: ConnectionID;
}