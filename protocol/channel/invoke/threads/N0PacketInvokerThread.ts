import { WebSocket } from 'ws';
import { PacketN0Wrap } from '../../../packet/wrapper/PacketN0Wrap';
import AESSecure from '../../../secure/AESSecure';
import { ChannelState } from '../../ChannelState';
import { Pipe } from '../../../pipe/Pipe';
import { BitStream } from 'ts-bitstream';
import { NInvokerThread } from '../NInvokerThread';

/**
 * N0 пакет - пакет обертки, принимается и клиентом и сервером. В зависимости от того в каком режиме работает протокол нужно выполнять его по разному
 */
export class N0PacketInvokerThread extends NInvokerThread {

    private aes : AESSecure;

    constructor(pipe : Pipe){
        super(pipe);
        this.aes = new AESSecure(this.pipe.getPhantom().getEncryptKey(), true);
    }
    
    /**
     * Выполнить пакет от лица клиента
     * @param packet PacketN0Wrap
     */
    public asClient(packet : PacketN0Wrap) {
        let encryptedPacketData = packet.getEncryptedPacketData();
        /**
         * Расшифровываем данные чистого пакета, так как они зашифрованы
         */
        let data = this.aes.decode(encryptedPacketData);
        /**
         * Создаем поток пакета, чтобы его читать
         */
        let bs : BitStream = new BitStream(data);
        let packetId = bs.readInt();
        if(isNaN(packetId)){
            console.debug(`Malformed packet recived from server. Maybe invalid encryption key!`);
            return;
        }
        let packetInvoke = this.pipe.getPhantom().getPacketManager().getById(packetId);
        if(!packetInvoke){
            console.debug(`Bad packet id ${packetId}`);
            return;
        }

        packetInvoke.func(packetInvoke.packet.recive(bs));
        return;
    }

    /**
     * Выполнить пакет от лица сервера
     * @param packet PacketN0Wrap
     * @returns ChannelState
     */
    public asServer(packet : PacketN0Wrap) : ChannelState {
        let src = packet.getSrc();
        let dst = this.pipe.getChannelManager().getChannelDst(src);
        if(!dst){
            console.debug(`Failed to recive packet by ${src} caused by no channel`);
            return;
        }
        let sockSource = this.pipe.getConnectionManager().getSocketByID(src);
        if(!sockSource || (sockSource.readyState !== sockSource.OPEN)){
            console.debug(`Protocol violation by ${src}! Current user dont connected`);
            return;
        }
        let sockDestenation : WebSocket = this.pipe.getConnectionManager().getSocketByID(dst);
        if(!sockDestenation ||  (sockDestenation.readyState !== sockDestenation.OPEN)){
            console.debug(`Failed to recive packet by ${src} caused by no destenation connected`);
            /**
             * Закрываем с плохим пользователем все каналы
             */
            this.pipe.getChannelManager().closeChannels(dst);
            this.pipe.getConnectionManager().removeConnectionByID(dst);
            return;
        }
        /**
         * Просто РЕТРАНСЛИРУЕМ ПАКЕТ НУЖНОМУ ПОЛЬЗОВАТЕЛЮ
         */
        this.pipe.send({packet: packet, dst: dst});
        return;
    }
}