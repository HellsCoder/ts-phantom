import { WebSocket } from 'ws';
import { Packet } from '../packet/Packet';
import { PacketQueue } from './PacketQueue';
import { PacketN0Wrap } from './../packet/wrapper/PacketN0Wrap';
import { ConnectionID } from '../connection/ConnectionID';
import { ChannelQueue } from './ChannelQueue';

export class QueueManager {

    private packetsInQueue : PacketQueue[];
    private channelsInQueue : ChannelQueue[];
    /**
     * Менеджер очереди пакетов
     * на стороне сервера
     */
    constructor() {
        this.packetsInQueue = [];
        this.channelsInQueue = [];
    }


    /**
     * Добавляет запрос в очередь
     * @param src исходный ид
     * @param dst целевой ид
     */
    public addRequestToQueue(src : ConnectionID, dst : ConnectionID){
        if(this.isAlreadyRequest(src, dst)){
            /**
             * Идентичный запрос уже существует
             */
            return;
        }
        this.channelsInQueue.push({
            src: src,
            dst: dst
        });
    }

    private isAlreadyRequest(src: ConnectionID, dst: ConnectionID) : boolean {
        for(let i = 0; i < this.channelsInQueue.length; i++){
            let channelQueue : ChannelQueue = this.channelsInQueue[i];
            if(channelQueue.src === src && channelQueue.dst === dst){
                return true;
            }
        }
        return false;
    }

    public getChannel(src : ConnectionID) : ChannelQueue {
        for(let i = 0; i < this.channelsInQueue.length; i++){
            let channelQueue : ChannelQueue = this.channelsInQueue[i];
            if(channelQueue.src === src){
                return channelQueue;
            }
        }
        return null;
    }   

    /**
     * Убрать соединение из очереди, т.к оно принято, или например отклонено
     */
    public removeFromQueue(src: ConnectionID, dst: ConnectionID) : boolean {
        for(let i = 0; i < this.channelsInQueue.length; i++){
            let channelQueue : ChannelQueue = this.channelsInQueue[i];
            if(channelQueue.src === src || channelQueue.dst === dst){
                this.channelsInQueue.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    /**
     * Добавить пакет в очередь пакетов
     * @param packet Packet добавляемый в очередь
     */
    public addPacketToQueue(packet : Packet) {
        this.packetsInQueue.push({
            packet: packet
        });
    }

    /**
     * Вернуть очередь пакетов
     * @returns все пакеты в очереди
     */
    public getAll() : PacketQueue[] {
        return this.packetsInQueue;
    }

    /**
     * Отправляет всю очередь адресатам
     * @param socketClient сокет освобождения очереди
     * @param src исходящий connection id очереди
     */
    public freeQueue(socketClient? : WebSocket, src? : string) {
        for(let i = 0; i < this.packetsInQueue.length; i++){
            let packetInQueue : PacketQueue = this.packetsInQueue[i];
            if(!packetInQueue.to && socketClient){
                let packet = packetInQueue.packet;
                if(src && (packet instanceof PacketN0Wrap)){
                    packet.setSrc(src);
                }
                socketClient.send(packet.send().getBytes().asString(), {binary: true});
                this.packetsInQueue.splice(i, 1);
            }
        }
    }


}