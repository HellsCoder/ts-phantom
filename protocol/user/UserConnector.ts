import { Phantom } from "../Phantom";
import { PacketN3Disconnect } from "../packet/handshake/PacketN3Disconnect";
import { ConnectionID } from "../connection/ConnectionID";
import { ConnectResponse, PacketN2ConnectResponse } from "../packet/handshake/PacketN2ConnectResponse";
import { PacketN1Connect } from './../packet/handshake/PacketN1Connect';
import { Event } from "../eventbus/Event";

export class UserConnector {

    private phantom : Phantom;

    private lastConnectionId : ConnectionID;
    private currentConnectedId : ConnectionID;


    constructor(phantom : Phantom){
        this.phantom = phantom;
        let _this = this;
        this.phantom.eventBus.on(Event.ON_CONNECT_PROCESS, function(id : ConnectionID, response : ConnectResponse){
            /**
             * Пишем ид пользователя который пытался соединиться в последние соединения
             */
            if(response === ConnectResponse.CONNECT_THROW){
                _this.lastConnectionId = id;
            }
            /**
             * Пишем ид пользователя с которым установлено успешное соединение
             */
            if(response === ConnectResponse.CONNECTION_DONE){
                _this.currentConnectedId = id;
            }
        });
    }

    /**
     * Отклонить запрос на соединение
     */
     public cancel() {
        if(!this.lastConnectionId){
            return;
        }
        this.phantom.send(new PacketN2ConnectResponse(ConnectResponse.DISCARDED, this.lastConnectionId));
        this.lastConnectionId = null;
    }

    /**
     * Принять запрос на соединение
     */
    public accept(){
        if(!this.lastConnectionId){
            return;
        }
        this.phantom.send(new PacketN2ConnectResponse(ConnectResponse.APPROVED, this.lastConnectionId));
        this.lastConnectionId = null;
    }


    /**
     * Установить соединение с конкретным пользователем на сервере
     * @param id ид пользователя 6 символов
     */
     public сonnect(id : ConnectionID) {
        /**
         * Отменяем текущие запросы на соединение, либо если ид человека, с которым мы хотим установить соединение - равен ид человка который ранее у нас запрашивал соединение (пользователи друг другу кинули запрос - приниаем соединение)
         */
        if(this.lastConnectionId === id){
            this.accept();
            return;
        }else{
            this.cancel();
        }
        this.phantom.send(new PacketN1Connect(this.phantom.getPipeLine().getNowConnectionId(), id));
    }

    /**
     * Обрывает текущий канал связи любого типа (входящий/исходящий)
     */
    public disconnect() : void {
        /**
         * Отправляем пакет закрытия соединения
         */
        this.phantom.send(new PacketN3Disconnect(this.phantom.getPipeLine().getNowConnectionId()));
    }


    /**
     * Получает пользователя с которым клиент соединен прямо сейчас
     * @returns ид соединения
     */
    public getIdCurrentConnect() : ConnectionID {
        return this.currentConnectedId;
    }

}