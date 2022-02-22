import { ConnectionID } from "../connection/ConnectionID";

/**
 * Объект канала, создается при установке соединения
 */
export interface Channel {
    /**
     * Кто установил соединение
     */
    src: ConnectionID;
    /**
     * Кому будут назначены пакеты
     */
    dst: ConnectionID;
}