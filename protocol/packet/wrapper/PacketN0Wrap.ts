import { BitStream, StringByteEncode } from "ts-bitstream";
import { Packet } from "../Packet";
import AESSecure from '../../secure/AESSecure';
import { ConnectionID } from "../../connection/ConnectionID";
import { throws } from "assert";

/**
 * Нулевой пакет. Пакет для всех клиентских пакетов. Нужен для шифрования данных обмена между клиентом и сервером, при этом сервер не может эти данные прочитать
 */
export class PacketN0Wrap extends Packet {

    private src : ConnectionID;
    private packet : Packet;

    private recivedStream : string;
    private encKey: string;
    private aes : AESSecure;

    constructor(src? : ConnectionID, packet? : Packet, encKey? : string){
        super();
        this.src = src;
        this.packet = packet;
        this.encKey = encKey;
        this.aes = new AESSecure(this.encKey, true);
    }

    public getPacketId(): number {
        return 0;
    }

    /**
     * Вызывается при получении пакета Zero
     * @param bs BitStream
     */
    public recive(bs: BitStream) : Packet {
        this.src = bs.readString(6); //отправитель
        this.recivedStream = bs.readString(); //зашифрованный пакет
        return this;
    }

    /**
     * Вызывается при отправке пакета
     * @returns bitstream для отправки
     */
    public send(): BitStream {
        let bs : BitStream = new BitStream();
        bs.writeInt(this.getPacketId()); //ид пакета
        bs.writeString(this.src); //отправитель
        bs.writeString(this.aes.encode(this.packet.send().getBytes().asString()), StringByteEncode.AUTOMATIC); //зашифрованный пакет
        return bs;
    }

    /**
     * Откуда идет пакет (connection id)
     * @returns строка
     */
    public getSrc() : ConnectionID {
        return this.src;
    }

    public setSrc(src : ConnectionID) {
        this.src = src;
    } 
    /**
     * Получает чистые данные пакета (которые можно потом поместить в BitStream и начать читать)
     */
    public getEncryptedPacketData(){
        return this.recivedStream;
    }

}