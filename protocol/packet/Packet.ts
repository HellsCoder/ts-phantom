import {BitStream} from "ts-bitstream";
import { ConnectionID } from "../connection/ConnectionID";
import { RawData } from 'ws';

export abstract class Packet {

    private sender : ConnectionID;
    private binnaryData : RawData;

    public abstract getPacketId() : number;
    public abstract recive(bs : BitStream) : Packet;
    public abstract send() : BitStream;

    /**
     * Получить отправителя пакета
     * @returns отправитель пакета
     */
    public getSender() : ConnectionID {
        return this.sender;
    }

    /**
     * Заполняет отправителя пакета
     * @param sender отправитель пакета
     */
    public setSender(sender : ConnectionID){
        this.sender = sender;
    }

    /**
     * Заполняет оригинальные пришедшие данные пакета
     * @param binnaryData оригинальные данные пакета
     */
    public setBinnaryData(binnaryData : RawData){
        this.binnaryData = binnaryData;
    }

    /**
     * Получить оригинальные данные пакета 
     * @returns оригинальные данные пакета
     */
    public getBinnaryData() : RawData {
        return this.binnaryData;
    }
}