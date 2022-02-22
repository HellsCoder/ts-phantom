import { BitStream } from "ts-bitstream";
import { ConnectionID } from "../../connection/ConnectionID";
import { Packet } from "../Packet";

/**
 * Пакет закрытия текущего открытого канала между двумя пользователями
 */
export class PacketN3Disconnect extends Packet {

    private disconnector : ConnectionID;

    /**
     * Пакет отсоединения от канала
     * @param disconnctor кто отключается от канала
     */
    constructor(disconnctor? : ConnectionID) {
        super();
        this.disconnector = disconnctor;
    }

    public getPacketId(): number {
        return -3;
    }

    public recive(bs: BitStream): Packet {
        this.disconnector = bs.readString(6);
        return this;
    }

    public send(): BitStream {
        let bs : BitStream = new BitStream();
        bs.writeInt(this.getPacketId());
        bs.writeString(this.disconnector);
        return bs;
    }
    
    public getDisconnector() : ConnectionID {
        return this.disconnector;
    }
}