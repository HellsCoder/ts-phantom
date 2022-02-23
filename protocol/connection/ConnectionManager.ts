import { WebSocket } from "ws";
import { Connection } from "./Connection";
import { ConnectionID } from "./ConnectionID";

export class ConnectionManager {

    private connections : Connection[];

    constructor() {
        this.connections = [];
    }

    /**
     * Получает сокет по ид для отправки пакета
     * @param id string ид соединения
     * @returns socket или null
     */
    public getSocketByID(id : ConnectionID) : WebSocket {
        for(let i = 0; i < this.connections.length; i++){
            let connection : Connection = this.connections[i];
            if(connection.id === id){
                return connection.socket;
            }
        }
        return null;
    }

    /**
     * Проверяет, занят ли ConnectionID
     * @returns bool
     */
    public checkIdBusy(id : ConnectionID) : boolean {
        for(let i = 0; i < this.connections.length; i++){
            if(this.connections[i].id === id){
                return true;
            }
        }
        return false;
    }

    /**
     * Добавляет соединение на сервер, генерирует ему ид
     * @param socket WebSocket сокет
     * @returns string ид соединения для дальнейших обращений
     */
    public addConnection(socket : WebSocket) : ConnectionID { 
        let id = this.genID();
        if(this.checkIdBusy(id)){
            /**
             * ID занят, закрываем соединение, отправляем код закрытия с коллизией
             */
            socket.send(0x700, {binary:true});
            socket.close();
            return;
        }
        this.connections.push({socket: socket, id : id});
        return id;
    }

    /**
     * Удаляет соединение из таблицы соединений
     * @param socket отключенный сокет
     */
    public removeConnection(socket : WebSocket) : void {
        for(let i = 0; i < this.connections.length; i++){
            let connection : Connection = this.connections[i];
            if(connection.socket === socket){
                this.connections.splice(i, 1);
            }
        }
    }

    /**
     * Удаляет соединение из таблицы соединений по ид
     * @param id отключенный ид
     */
    public removeConnectionByID(id : ConnectionID) : void {
        for(let i = 0; i < this.connections.length; i++){
            let connection : Connection = this.connections[i];
            if(connection.id === id){
                this.connections.splice(i, 1);
            }
        }
    }

    /**
     * Получить ид соединения по сокету
     * @param socket сокет
     * @returns ид соединения
     */
    public getConnectionBySock(socket : WebSocket) : ConnectionID {
        for(let i = 0; i < this.connections.length; i++){
            let connection : Connection = this.connections[i];
            if(connection.socket === socket){
                return connection.id;
            }
        }
    }

    private genID() : string {
        let length = 6;
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
}
