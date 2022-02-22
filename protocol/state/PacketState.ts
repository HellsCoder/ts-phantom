export enum PacketState {

    /**
     * Пакет отправлен
     */
    PACKET_SENDED,

    /**
     * Пакет попал в очередь
     */
    PACKET_IN_QUEUE,

    /**
     * Пакет не отправлен (например закрыто соединение)
     */
    PACKET_FAIL

}