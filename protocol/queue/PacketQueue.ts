import { Packet } from "../packet/Packet";

export interface PacketQueue {
    packet : Packet;
    to? : string;
}