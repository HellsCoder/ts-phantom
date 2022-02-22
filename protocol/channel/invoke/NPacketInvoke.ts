import { PacketN1Connect } from '../../packet/handshake/PacketN1Connect';
import { ConnectResponse, PacketN2ConnectResponse } from '../../packet/handshake/PacketN2ConnectResponse';
import { PacketN3Disconnect } from '../../packet/handshake/PacketN3Disconnect';
import { ProtocolMode } from '../../sock/ProtocolMode';
import { PacketN0Wrap } from './../../packet/wrapper/PacketN0Wrap';
import { Pipe } from './../../pipe/Pipe';
import { N0PacketInvokerThread } from './threads/N0PacketInvokerThread';
import { N1PacketInvokerThread } from './threads/N1PacketInvokerThread';
import { N2PacketInvokerThread } from './threads/N2PacketInvokerThread';
import { N3PacketInvokerThread } from './threads/N3PacketInvokerThread';

/**
 * Исполнитель N(системных) пакетов
 */
export class NPacketInvoke {

    private pipe : Pipe;

    constructor(pipe : Pipe){
        this.pipe = pipe;
    }

    /**
     * Обработка пакета отключения одного из оппонентов
     * @param packet Packet
     */
     public invokeN3Packet(packet : PacketN3Disconnect){
        let n3Invoker : N3PacketInvokerThread = new N3PacketInvokerThread(this.pipe);
        if(this.pipe.getPhantom().getProtocolMode() === ProtocolMode.CLIENT){
            n3Invoker.asClient(packet);
        }else{
            n3Invoker.asServer(packet);
        }
    }
    

    /**
     * Обработка пакета ОТВЕТА на запрос о подключении
     * @param packet Packet
     */
    public invokeN2Packet(packet : PacketN2ConnectResponse){
        let n2Invoker : N2PacketInvokerThread = new N2PacketInvokerThread(this.pipe);
        if(this.pipe.getPhantom().getProtocolMode() === ProtocolMode.CLIENT){
            n2Invoker.asClient(packet);
        }else{
            n2Invoker.asServer(packet);
        }
    }
    
    /**
     * Обработка пакета запроса подключения
     * @param packet Packet
     */
    public invokeN1Packet(packet : PacketN1Connect) {
        let n1Invoker : N1PacketInvokerThread = new N1PacketInvokerThread(this.pipe);
        if(this.pipe.getPhantom().getProtocolMode() === ProtocolMode.CLIENT){
            n1Invoker.asClient(packet);
        }else{
            n1Invoker.asServer(packet);
        }
    }

    /**
     * Обработка пакета обертки
     * @param packet Packet
     */
    public invokeN0Packet(packet : PacketN0Wrap) {
        let n0Invoker : N0PacketInvokerThread = new N0PacketInvokerThread(this.pipe);
        if(this.pipe.getPhantom().getProtocolMode() === ProtocolMode.CLIENT){
            n0Invoker.asClient(packet);
        }else{
            n0Invoker.asServer(packet);
        }
    }


}