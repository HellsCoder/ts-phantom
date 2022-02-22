import { ConnectionID } from '../connection/ConnectionID';
import { Channel } from './Channel';
/**
 * Менеджер каналов. В нем список всех соединений p2p которые обслуживаются текущим сервером
 */
export class ChannelManager {

    private channels : Channel[];

    constructor() {
        this.channels = [];
    }

    /**
     * Добавляет соединение p2p
     * @param src кто инициирует канал
     * @param dst кто цель канала
     */
    public addChannel(src : ConnectionID, dst : ConnectionID){
        this.channels.push({src : src, dst : dst});
    }

    /**
     * Разрывает все соединения
     * @param id ид соединения с которым разорвать каналы
     */
    public closeChannels(id : ConnectionID) {
        for(let i = 0; i < this.channels.length; i++){
            let channel : Channel = this.channels[i];
            if(channel.dst === id){
                this.channels.splice(i, 1);
            }
            if(channel.src === id){
                this.channels.splice(i, 1);
            }
        }
    }

    /**
     * Получает ид соединения получателя по известному ид
     * @param id ид соединения
     */
    public getChannelDst(id : ConnectionID) : string {
        for(let i = 0; i < this.channels.length; i++){
            let channel : Channel = this.channels[i];
            if(channel.dst === id){
                /**
                 * Если ид - цель канала, то возвращаем инициатора 
                 */
                return channel.src;
            }
            if(channel.src === id){
                /**
                 * Если ид - инициатор канала, то возвращаем цель
                 */
                return channel.dst;
            }
        }
        return null;
    }
}