import { Packet } from "./Packet";
import { PacketInvoke } from './PacketInvoke';

/**
 * Менеджер пакетов, список всех пакетов, а так же их регистрация и трансляция в битстрим
 */
export class PacketManager {

    private packets : PacketInvoke[];

    constructor(){
        this.packets = [];
    }

    /**
     * Регистрация нового пакета
     * @param packet пакет <?Packet>
     * @param func функция которая будет выполняться когда пакет придет и будет разобран
     */
    public addPacket(packet : Packet, func?: (packet : any) => void) {
        if(packet.getPacketId() < 1){
            console.info(`Bad packet ID ${packet.getPacketId()} than minimum id allowed 1`);
            return;
        }
        this.packets.push({packet : packet, func : func});
    }


    /**
     * Регистрация системного пакета, у них приоритет в очередях и они могут иметь любой ID
     * @param packet пакет <?Packet>
     * @param func функция которая будет выполняться когда пакет придет и будет разобран
     * @param context контекст функции
     */
    public addNPacket(packet : Packet, func?: (packet : any) => void, context? : Object) {
        this.packets.push({packet : packet, func : func, context: context});
    }


    /**
     * Получить пакет по ID
     * @param id id пакета
     * @returns пакет PacketInvoke
     */
    public getById(id : number) : PacketInvoke {
        for(let i = 0; i < this.packets.length; i++){
            let packet : Packet = this.packets[i].packet;
            if(packet.getPacketId() === id){
                return this.packets[i];
            }
        }
        return null;
    }

}