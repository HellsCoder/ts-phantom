import { Event } from "../../../eventbus/Event";
import { PacketN3Disconnect } from "../../../packet/handshake/PacketN3Disconnect";
import { NInvokerThread } from "../NInvokerThread";

export class N3PacketInvokerThread extends NInvokerThread {

    public asClient(packet: PacketN3Disconnect) {
        /**
         * Если пакет приходит на клиент - значит с ним разорвали соединение, уведомляем об этом шину 
         * событий
         */
        this.pipe.getPhantom().eventBus.fire(Event.ON_OPPONENT_DISCONNECT, packet.getDisconnector());
    }

    public asServer(packet: PacketN3Disconnect) {
        let channelOpponent = this.pipe.getChannelManager().getChannelDst(packet.getDisconnector());
        if(!channelOpponent){
            /**
             * Если пользователь отключается, а канала у него нет - значит ничего не делаем, 
             * он ведь уже
             */
            return;
        }
        /**
         * Разрываем все каналы
         */
        this.pipe.getChannelManager().closeChannels(packet.getDisconnector());
        /**
         * Отправляем сообщение оппоненту отключившегося - что его оппонент отключился
         */
        this.pipe.send({
            packet: new PacketN3Disconnect(packet.getDisconnector()),
            dst: channelOpponent
        });
    }

}