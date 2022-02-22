import { BitStream } from "ts-bitstream";
import { Packet } from "../Packet";

/**
 * Пакет установки соединения, отправляется когда один из пользователей хочет с кем то соединиться
 */
export class PacketN1Connect extends Packet {

    private src : string;
    private dst : string;

    /**
     * Для установки соединения
     * @param src исходный адрес
     * @param dst адрес, с кем нужно соединиться
     */
    constructor(src? : string, dst?: string){
        super();
        this.src = src;
        this.dst = dst;
    }

    public getPacketId(): number {
        return -1;
    }

    public recive(bs: BitStream): Packet {
        this.src = bs.readString(6);
        this.dst = bs.readString(6);
        return this;
    }

    public send(): BitStream {
        let bs : BitStream = new BitStream();
        bs.writeInt(this.getPacketId());
        bs.writeString(this.src);
        bs.writeString(this.dst);
        return bs;
    }

    public getSrc() : string {
        return this.src;
    }

    public getDst() : string {
        return this.dst;
    }

}