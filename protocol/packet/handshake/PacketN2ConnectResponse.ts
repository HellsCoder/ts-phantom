import { BitStream } from "ts-bitstream";
import { ConnectionID } from "../../connection/ConnectionID";
import { Packet } from "../Packet";

/**
 * Интерфейс статусов соединения, статусы отправляет сервер 
 */
export enum ConnectResponse {
    /**
     * Соединение успешно запрошено
     */
    REQUESTED,
    /**
     * Пользователь, который отправил запрос на соединение - уже с кем-то соединен
     */
    SRC_ALREADY_CONNECTED,
    /**
     * Пользователь, которому отправили запрос на соединение - уже с кем-то соединен
     */
    DST_ALREADY_CONNECTED,
    /**
     * Пользователь, с которым была попытка установить 
     * соединение - не найден (возможно просто подключен к другой ноде)
     */
    DST_NOT_FOUND,
    /**
     * Подключение не удалось по другим причинам (например попытка обхода протокола)
     */
    NOT_CONNECTED,

    /**
     * Подключение отклонено другой стороной
     */
    DISCARDED,

    /**
     * Подключение принято другой стороной
     */
    APPROVED,

    /**
     * Подключение окончательно успешно установлено
     */
    CONNECTION_DONE,

    /**
     * Соединение не установлено, потому что у вас уже есть нерешенные запросы на подключения
     */
    NOT_CONNECT_REQUEST_UNCLOSED,

    /**
     * Инициализирвано соединение, пакет с этим параметром получает машина с которой только что установили соединение. После этого - соединение можно отклонить, или принять
     */
    CONNECT_THROW
}

/**
 * Отправляется только сервером, содержит в себе ответ на попытку соединиться с другим
 * пользователем, а так же ид другого пользователя
 */
export class PacketN2ConnectResponse extends Packet {

    private response : ConnectResponse;
    private dst : ConnectionID;

    constructor(response? : ConnectResponse, dst? : ConnectionID){
        super();
        this.response = response;
        this.dst = dst;
    }

    public getPacketId(): number {
        return -2;
    }
    
    public recive(bs: BitStream): Packet {
        this.response = bs.readInt();
        this.dst = bs.readString(6);
        return this;    
    }

    public send(): BitStream {
        let bs : BitStream = new BitStream();
        bs.writeInt(this.getPacketId());
        bs.writeInt(this.response);
        bs.writeString(this.dst);
        return bs;
    }

    /**
     * Получить ответ на попытку установить соединение с целью
     * @returns ответ
     */
    public getResponse() : ConnectResponse {
        return this.response;
    }

    /**
     * ID целевого соединения 
     * @returns id соединения
     */
    public getDst() : ConnectionID {
        return this.dst;
    }



}