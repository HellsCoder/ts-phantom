import { Event } from "../../../eventbus/Event";
import { ConnectResponse, PacketN2ConnectResponse } from "../../../packet/handshake/PacketN2ConnectResponse"
import { NInvokerThread } from "../NInvokerThread"
import { ChannelQueue } from '../../../queue/ChannelQueue';

/**
 * Обработка пакета ответа на попытку соединения
 */
export class N2PacketInvokerThread extends NInvokerThread {


    public asClient(packet: PacketN2ConnectResponse) {
        /**
         * Когда пакет N2 приходит к клиенту - значит это ответ на попытку соединения, либо инициализация соединения
         */
        switch(packet.getResponse()){
            case ConnectResponse.CONNECTION_DONE:
                this.pipe.getPhantom().eventBus.fire(Event.ON_OPPONENT_CONNECT, packet.getDst());
                break;
            case ConnectResponse.DISCARDED:
                this.pipe.getPhantom().eventBus.fire(Event.ON_CONNECT_DISCARDED, packet.getDst());
                break;
        }
        this.pipe.getPhantom().eventBus.fire(Event.ON_CONNECT_PROCESS, packet.getDst(), packet.getResponse());
    }

    public asServer(packet: PacketN2ConnectResponse) {
        /**
         * Инициатор соединения - ответ отправляется ему, так как он его и запрашивал
         */
        let initiator = packet.getDst();
        let response = packet.getResponse();

        let channel : ChannelQueue = this.pipe.getQueueManager().getChannel(initiator);
        if(!channel || channel.dst !== packet.getSender()){
            /**
             * Если канал никто не запрашивал, либо запрашивал но не наш пользователь
             */
            this.pipe.send({
                packet: new PacketN2ConnectResponse(ConnectResponse.NOT_CONNECTED, initiator),
                dst: packet.getSender()
            });
            return;
        }
        /**
         * Проверки на легитимность соединения пройдены
         */
        if(!this.pipe.getConnectionManager().getSocketByID(initiator)){
            this.pipe.send({
                packet: new PacketN2ConnectResponse(ConnectResponse.NOT_CONNECTED, initiator),
                dst: packet.getSender()
            });
            return;
        }
        if(this.pipe.getChannelManager().getChannelDst(packet.getSender())){
            this.pipe.send({
                packet: new PacketN2ConnectResponse(ConnectResponse.DST_ALREADY_CONNECTED, initiator),
                dst: packet.getSender()
            });
            return;
        }
        if(this.pipe.getChannelManager().getChannelDst(initiator)){
            this.pipe.send({
                packet: new PacketN2ConnectResponse(ConnectResponse.SRC_ALREADY_CONNECTED, initiator),
                dst: packet.getSender()
            });
            return;
        }
        if(response === ConnectResponse.APPROVED){
            /**
             * Проверки подключений пройдены, а запрос подтвержден, удаляем канал из очереди на соединения
             */
            if(!this.pipe.getQueueManager().removeFromQueue(initiator, packet.getSender())){
                this.pipe.send({
                    packet: new PacketN2ConnectResponse(ConnectResponse.NOT_CONNECTED, initiator),
                    dst: packet.getSender()
                });
                return;
            }
            /**
             * Создаем новый канал между двумя пользователями, отправляем обоим уведомление что они соединены 
             */
            this.pipe.getChannelManager().addChannel(initiator, packet.getSender());
            this.pipe.send({
                packet: new PacketN2ConnectResponse(ConnectResponse.CONNECTION_DONE, initiator),
                dst: packet.getSender()
            });
            this.pipe.send({
                packet: new PacketN2ConnectResponse(ConnectResponse.CONNECTION_DONE, packet.getSender()),
                dst: initiator
            });
            return;
        }  
        if(response === ConnectResponse.DISCARDED){
            /**
             * Проверки подключений пройдены, а запрос отклонен, удаляем канал из очереди на соединения
             */
            if(!this.pipe.getQueueManager().removeFromQueue(initiator, packet.getSender())){
                return;
            }
            /**
             * Отправляем пакет инициатору о том, что его попытка соединения отклонена
             */            
            this.pipe.send({
                packet: new PacketN2ConnectResponse(ConnectResponse.DISCARDED, packet.getSender()),
                dst: initiator
            });
            return;
        }
    }

}