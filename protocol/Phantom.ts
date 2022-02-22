import { ProtocolMode } from "./sock/ProtocolMode";
import { PacketManager } from './packet/PacketManager';
import { ServerFactory } from './pipe/sides/ServerFactory';
import { Pipe } from './pipe/Pipe';
import { ClientFactory } from './pipe/sides/ClientFactory';
import { Packet } from "./packet/Packet";
import { PacketState } from "./state/PacketState";
import { PacketN1Connect } from './packet/handshake/PacketN1Connect';
import { PacketN0Wrap } from './packet/wrapper/PacketN0Wrap';
import { NPacketInvoke } from "./channel/invoke/NPacketInvoke";
import { UserConnector } from "./user/UserConnector";
import { PacketN2ConnectResponse } from "./packet/handshake/PacketN2ConnectResponse";
import { EventBus } from './eventbus/EventBus';
import { PacketN3Disconnect } from "./packet/handshake/PacketN3Disconnect";

export class Phantom {

    /**
     * Порт прослушивания
     */
    private port : number;

    /**
     * Режим протокола
     */
    private protoMode : ProtocolMode;

    /**
     * Менеджер сетевых пакетов
     */
    private packetManager : PacketManager;

    /**
     * Ссылка для подключения
     */
    private url : string;

    /**
     * Так как протокол с шифрованием - шифрование включается сразу, ключ выбирается случайный. Ключ по сети не отправляется. Чтобы начать общаться с этим клиентом - нужно знать этот ключ
     */
    private keyEncryption: string;

    /**
     * Пайплайн для приема/отправки данных
     */
    private pipeLine: Pipe;

    private nPacketInvoker : NPacketInvoke;

    private userConnector : UserConnector;

    public eventBus : EventBus;

    /**
     * Конструктор протокола
     * @param protoMode в каком режиме работает протокол
     * @param port порт протокола
     * @param url обязательный параметр если ProtocolMode.CLIENT - указать адрес до серверной машины без порта
     */
    constructor(protoMode : ProtocolMode, port : number, url? : string) {
        this.port = port;
        this.url = url;
        this.protoMode = protoMode;
        this.eventBus = new EventBus();
        this.packetManager = new PacketManager();
        this.userConnector = new UserConnector(this);
    }

    /**
     * Регистрирует N пакеты (n-negative. пакеты которые имеют отрицательный PacketID, т.е системные пакеты протокола)
     * @param pipe пайплайн
     */
    private nPacketsRegistre(pipe : Pipe) {
        this.nPacketInvoker = new NPacketInvoke(pipe);
        /**
         * Третьим аргументом обязательно передаем контекст, иначе функция вызывается с ограниченной областью видимости
         */
        this.packetManager.addNPacket(new PacketN0Wrap, this.nPacketInvoker.invokeN0Packet, this.nPacketInvoker);
        this.packetManager.addNPacket(new PacketN1Connect, this.nPacketInvoker.invokeN1Packet, this.nPacketInvoker);
        this.packetManager.addNPacket(new PacketN2ConnectResponse, this.nPacketInvoker.invokeN2Packet, this.nPacketInvoker);
        this.packetManager.addNPacket(new PacketN3Disconnect, this.nPacketInvoker.invokeN3Packet, this.nPacketInvoker);
    }

    /**
     * Возвращает ключ шифрования
     * @returns ключ шифрования
     */
    public getEncryptKey() : string {
        if(this.protoMode === ProtocolMode.SERVER){
            /**
             * Серверу не нужен ключ шифрования, он ничего не шифрует, устанавливаем такой
             */
            this.keyEncryption = "SERVER";
        }
        return this.keyEncryption;
    }

    /**
     * Устанавливает ключ шифрования
     * @param keyEncryption ключ
     */
    public setEncryptionKey(keyEncryption : string) {
        this.keyEncryption = keyEncryption;
    }

    /**
     * Получить менеджер пакетов для регистрации новых сетевых пакетов
     * @returns PacketManager
     */
    public getPacketManager() : PacketManager {
        return this.packetManager;
    }

    /**
     * Получить режим работы протокола
     * @returns режим работы протокола
     */
    public getProtocolMode() : ProtocolMode {
        return this.protoMode;
    }

    /**
     * Получить обьект для регистрации событий
     * @returns EventBus
     */
    public getEventBus() : EventBus {
        return this.eventBus;
    }

    /**
     * Класс для соединения с другими пользователями протокола, а так же для отслеживания соединений с вами и их принятия
     * @returns UserConnector
     */
    public getUserConnector() : UserConnector {
        return this.userConnector;
    }

    /**
     * Отправить пакет
     * @param packet пакет
     * @returns статус отправки пакета PacketState
     */
    public send(packet : Packet) : PacketState {
        if(!this.pipeLine){
            console.info(`Packet(ID: ${packet.getPacketId()}) was not send by pipe closed`);
            return;
        }
        let state = this.pipeLine.send(packet);
        if(state === PacketState.PACKET_FAIL){
            console.info(`Failed to send packet ${packet.getPacketId()}`);
        }
        return state;
    }

    public getPipeLine() : Pipe {
        return this.pipeLine;
    }

    /**
     * Функция прослушивания
     */
    public connect(callbackId? : Function) {
        let access : Pipe;
        if(this.protoMode === ProtocolMode.SERVER){
            /**
             * Если текущий инстанс протокола в режиме сервера
             */
            access = new ServerFactory(this.port).listen(this);
            this.pipeLine = access;   
            this.nPacketsRegistre(this.pipeLine);
            return null;
        }
        if(this.protoMode === ProtocolMode.CLIENT){
            /**
             * Если текущий инстанс протокола в режиме клиента
             */
            access = new ClientFactory(`${this.url}:${this.port}`).listen(this);
            this.pipeLine = access;   
            this.nPacketsRegistre(this.pipeLine);
            this.keyEncryption = Math.random().toString(14).substring(2).toLocaleUpperCase();
            return this.pipeLine.getConnectionId(callbackId);
        }
        return null;
    }

}