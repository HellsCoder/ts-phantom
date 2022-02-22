import { RawData, WebSocketServer } from 'ws';
import { WebSocket } from 'ws';
import { Phantom } from '../../Phantom';
import { Pipe } from '../Pipe';
import { ConnectionManager } from './../../connection/ConnectionManager';
import { PacketChannelInvoker } from './../../channel/invoke/PacketChannelInvoker';
import { ChannelManager } from './../../channel/ChannelManager';
import { Packet } from '../../packet/Packet';
import { PacketState } from '../../state/PacketState';
import { ServerOutPacket } from './../../packet/ServerOutPacket';
import { QueueManager } from '../../queue/QueueManager';
import { PacketN3Disconnect } from './../../packet/handshake/PacketN3Disconnect';

/**
 * Класс для прослушивания протокола в качестве сервера
 */
export class ServerFactory implements Pipe {

    /**
     * Порт
     */
    private port: number;

    /**
     * Инстанс сетевого движка
     */
    private phantom : Phantom;

    private connectionManager : ConnectionManager;
    private channelInvoker : PacketChannelInvoker;
    private channelManager: ChannelManager;
    private queueManager : QueueManager;

    /**
     * Инстанс сервера
     */
    private wsServer: WebSocketServer;

    /**
     * Прослушивание в качестве сервера
     * @param port прослушеваемый порт
     */
    constructor(port: number) {
        this.port = port;
        this.connectionManager = new ConnectionManager();
        this.channelInvoker = new PacketChannelInvoker(this);
        this.channelManager = new ChannelManager();
        this.queueManager = new QueueManager();
    }

    public getQueueManager() : QueueManager {
        return this.queueManager;
    }

    /**
     * Получить менеджер соединений
     * @returns ConnectionManager
     */
    public getConnectionManager() : ConnectionManager {
        return this.connectionManager;
    }
    
    /**
     * Получить менеджер каналов p2p
     * @returns ChannelManager
     */
    public getChannelManager() : ChannelManager {
        return this.channelManager;
    }

    /**
     * Слушать порт в качестве сервера
     */
    public listen(phantom : Phantom): Pipe {
        this.phantom = phantom;
        this.wsServer = new WebSocketServer({
            port: this.port,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                clientNoContextTakeover: true,
                serverNoContextTakeover: true,
                serverMaxWindowBits: 10,
                concurrencyLimit: 10,
                threshold: 1024
            }
        });
        console.info(`[phantom-server] started at x.x.x.x:${this.port}`);

        this.listenBinaryData();
        return this;
    }

    public send(packetOut : ServerOutPacket) : PacketState {
        let packet = packetOut.packet;
        let dst = packetOut.dst;

        let sock : WebSocket = this.connectionManager.getSocketByID(dst);
        if(!sock || sock.readyState !== sock.OPEN){
            /**
             * Соединение закрыто или клиент не подключен к этой ноде
             */
            return PacketState.PACKET_FAIL;
        }
        if(packet.getPacketId() === 0){
            /**
             * Если пакет - это зашифрованная обертка, то так как у нас нет ключа шифрования, чтобы собрать пакет заново, просто отправляем его исходные бинарные данные
             */
            sock.send(packet.getBinnaryData(), {binary: true});
            return;
        }
        sock.send(packet.send().getBytes().asString(), {binary:true});
    }

    /**
     * Получить инстанс движка, во всех пайпах есть по интерфейсу Pipe
     * @returns инстанс движка
     */
    public getPhantom() : Phantom {
        return this.phantom;
    }

    /**
     * Прослушивает все соединения, и отправляет их нужным клиентам.
     */
    private listenBinaryData(): void {
        this.wsServer.on('connection', (ws : WebSocket) => {
            /**
             * Отправляем клиенту его ID подключения
             */
            let id = this.connectionManager.addConnection(ws);
            ws.send(id, {binary: true});

            ws.on('message', (data : RawData) => {
                this.channelInvoker.readData(data, id);
            });
        });
        this.wsServer.on('close', (ws : WebSocket) => {
            /**
             * При закрытии соединения убираем его из соединенных клиентов
             */
            this.connectionManager.removeConnection(ws);
            /**
             * Удаляем все каналы с ним
             */
            let connectionId = this.connectionManager.getConnectionBySock(ws);

            let channel = this.channelManager.getChannelDst(connectionId);
            if(channel){
                this.channelManager.closeChannels(connectionId);
                this.send({packet : new PacketN3Disconnect(connectionId), dst: channel});
            }

        })
    }
}