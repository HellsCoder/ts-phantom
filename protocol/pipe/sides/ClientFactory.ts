import { WebSocket } from 'ws';
import { Packet } from '../../packet/Packet';
import { Phantom } from '../../Phantom';
import { Pipe } from './../Pipe';
import { QueueManager } from './../../queue/QueueManager';
import { PacketState } from '../../state/PacketState';
import { PacketN0Wrap } from './../../packet/wrapper/PacketN0Wrap';
import { PacketChannelInvoker } from './../../channel/invoke/PacketChannelInvoker';
import { ConnectionID } from '../../connection/ConnectionID';


export class ClientFactory implements Pipe {

    /**
     * Инстанс клиента
     */
    private wsClient : WebSocket;
    private url : string;
    private phantom : Phantom;
    private queueManager : QueueManager;

    /**
     * Функция для возврата ид соединения
     */
    private connectionIdCall : Function;

    /**
     * ID соединения на ноде фантома
     */
    private connection : ConnectionID;

    private channelInvoker : PacketChannelInvoker;

    /**
     * Подключиться к серверу
     * @param url URL вида ws(s)://x.x.x.x:9001
     */
    constructor(url : string){
        this.queueManager = new QueueManager();
        this.channelInvoker = new PacketChannelInvoker(this);
        this.url = url;
    }

    public listen(phantom : Phantom) : Pipe {
        this.phantom = phantom;
        this.wsClient = new WebSocket(this.url);
        this.listenBinaryData();
        return this;
    }

    /**
     * Отправляет пакет по ранее установленному соединению
     * @param packet пакет
     * @returns статус отправки пакета
     */
    public send(packet : Packet) : PacketState {
        if(this.wsClient.readyState === this.wsClient.CLOSED 
            || this.wsClient.readyState === this.wsClient.CLOSING){
            return PacketState.PACKET_FAIL;
        }

        if(packet.getPacketId() > 0){
            /**
             * Если пакет не служебный (т.е это данные пользователей, например сообщения) - обязательное шифрование
             */
            packet = new PacketN0Wrap(this.connection, packet, this.getPhantom().getEncryptKey());
        }

        if(this.wsClient.readyState === this.wsClient.CONNECTING){
            /**
             * Если соединение еще не установлено, но устанавливается - добавляем пакет в очередь
             */
            this.queueManager.addPacketToQueue(packet);
            return PacketState.PACKET_IN_QUEUE;
        }

        this.wsClient.send(packet.send().getBytes().asString(), {binary: true});
        return PacketState.PACKET_SENDED;
    }

    public getConnectionId(callback? : Function) {
        this.connectionIdCall = function(id : ConnectionID){
            if(!callback){
                return;
            }
            return callback(id);
        }
    }

    public getNowConnectionId() : ConnectionID {
        if(!this.connection){
            /**
             * Если пытаться получить ид за пределаеми функции connect() - скорее всего это приведет к неудаче
             */
            throw new Error(`Trying to get id before initialized`);
        }
        return this.connection;
    }

    public getPhantom() : Phantom {
        return this.phantom;
    }

    private listenBinaryData() {
        this.wsClient.on('open', () => {
            console.info(`[phantom-client] connected to node ${this.url}`);
        });
        this.wsClient.on('message', (data) => {
            if(!this.connection){
                /**
                 * Первое сообщение от сервера - всегда connection ID
                 */
                this.connection = data.toString();
                /**
                 * Передаем ID соединения вверх по цепочке до вызова функции connect()
                 */
                this.connectionIdCall(this.connection);
                /**
                 * Освобождаем очередь
                 */
                this.queueManager.freeQueue(this.wsClient, this.connection);
                return;
            }
            /**
             * Читаем данные и пакеты
             */
            this.channelInvoker.readData(data);
        })
    }
}