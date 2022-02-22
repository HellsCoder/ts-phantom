
import { RawData } from 'ws';
import { BitStream } from 'ts-bitstream';
import { Pipe } from '../../pipe/Pipe';
import { ConnectionID } from '../../connection/ConnectionID';
import { ProtocolMode } from '../../sock/ProtocolMode';

export class PacketChannelInvoker {

    private pipe : Pipe;

    constructor(pipe : Pipe){
        this.pipe = pipe;
    }

    /**
     * Читает канал и выполняет пакеты
     * @param data данные канала
     * @returns читает канал
     */
    public readData(data : RawData, id? : ConnectionID) {
        try{
            let bs : BitStream = new BitStream(data.toString());
            let packetId = bs.readInt();

            if(isNaN(packetId)){
                /**
                 * Если данные не верные, или повреждены - отключаем такого чудика
                 */
                console.debug(`Malformed packet recived from ${id ? id : "server"}`);
                if(this.pipe.getPhantom().getProtocolMode() === ProtocolMode.SERVER && id){
                    let sock = this.pipe.getConnectionManager().getSocketByID(id);
                    sock.close(0, `Incorrect protocol data, socket closed by peer`);
                    this.pipe.getConnectionManager().removeConnectionByID(id);
                }
                return;
            }
            let packet = this.pipe.getPhantom().getPacketManager().getById(packetId);
            if(!packet){
                console.debug(`Bad packet id ${packetId}`);
                return;
            }
            packet.packet.setBinnaryData(data);
            if(id){
                packet.packet.setSender(id);
            }else{
                packet.packet.setSender("SERVER");
            }

            if(packet.context){
                packet.func.call(packet.context, packet.packet.recive(bs));
            }else{
                packet.func(packet.packet.recive(bs));
            }
        }catch(e){
            console.debug(`Malformed packet recived`);
            console.debug(e);
        }
    }


}