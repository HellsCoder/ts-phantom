import { Packet } from '../packet/Packet';
import { PacketState } from '../state/PacketState';
import { ConnectionManager } from './../connection/ConnectionManager';
import { Phantom } from './../Phantom';
import { ChannelManager } from './../channel/ChannelManager';
import { ServerOutPacket } from './../packet/ServerOutPacket';
import { ConnectionID } from '../connection/ConnectionID';
import { QueueManager } from './../queue/QueueManager';

/**
 * Абстрактный класс сторон прослушивания
 */
export interface Pipe {
    listen : Function;
    send : (packet : Packet | ServerOutPacket) => PacketState;
    getConnectionManager? : () => ConnectionManager;
    getConnectionId? : (callback? : Function) => void;
    getNowConnectionId? : () => ConnectionID;
    getPhantom : () => Phantom;
    getChannelManager?: () => ChannelManager;
    getQueueManager?: () => QueueManager; 
}