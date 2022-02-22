import { Packet } from "./Packet";

export interface PacketInvoke {

    packet : Packet;
    func?: (packet : any) => void;
    context? : Object;

}