import { ConnectionID } from "../../../connection/ConnectionID";
import { PacketN1Connect } from "../../../packet/handshake/PacketN1Connect";
import { ConnectResponse, PacketN2ConnectResponse } from "../../../packet/handshake/PacketN2ConnectResponse";
import { NInvokerThread } from "../NInvokerThread";

/**
 * Обработчик пакета подключения
 */
export class N1PacketInvokerThread extends NInvokerThread {

    public asClient(packet: PacketN1Connect) {
        /**
         * !!! Этот пакет не принимается клиентской стороной, вместо него принимается пакет PacketN2ConnectResponse с параметром ConnectResponse.CONNECT_THROW
         */
        ; 
    }

    public asServer(packet: PacketN1Connect) {
        let src : ConnectionID = packet.getSrc();
        let dst : ConnectionID = packet.getDst();

        /**
         * Проверяем, нет ли у отправителя текущих открытых запросов на подключение (одновременно пользователь может отправить только 1 запрос)
         */
        let inQueue = this.pipe.getQueueManager().getChannel(src);
        if(inQueue){
            this.pipe.send({
                packet : new PacketN2ConnectResponse(ConnectResponse.NOT_CONNECT_REQUEST_UNCLOSED, dst),
                dst: src
            });
            return;
        }

        /**
         * Проверяем, общаются ли уже пользователи с кем-либо
         */
        if(this.pipe.getChannelManager().getChannelDst(src)){
            this.pipe.send({
                packet : new PacketN2ConnectResponse(ConnectResponse.SRC_ALREADY_CONNECTED, dst),
                dst: src
            });
            return;
        }
        if(this.pipe.getChannelManager().getChannelDst(dst)){
            this.pipe.send({
                packet : new PacketN2ConnectResponse(ConnectResponse.DST_ALREADY_CONNECTED, dst),
                dst: src
            });
            return;
        }
        /**
         * Проверяем, подключены ли стороны к серверу
         */
        if(!this.pipe.getConnectionManager().getSocketByID(src)){
            this.pipe.send({
                packet : new PacketN2ConnectResponse(ConnectResponse.NOT_CONNECTED, dst),
                dst: src
            });
            return;
        }
        if(!this.pipe.getConnectionManager().getSocketByID(dst)){
            this.pipe.send({
                packet : new PacketN2ConnectResponse(ConnectResponse.DST_NOT_FOUND, dst),
                dst: src
            });
            return;
        }
        /**
         * Все проверки пройдены, отправляем пакет что соединение запрошено, добавляем запрос на соединение в очередь
         */
        this.pipe.getQueueManager().addRequestToQueue(src, dst);
        this.pipe.send({
            packet : new PacketN2ConnectResponse(ConnectResponse.REQUESTED, dst),
            dst: src
        });
        /**
         * Целевому пользователю отправляем пакет попытки установки соединения
         */
        this.pipe.send({
            packet: new PacketN2ConnectResponse(ConnectResponse.CONNECT_THROW, src),
            dst: dst
        });
    }
    
}