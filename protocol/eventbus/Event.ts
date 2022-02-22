
/**
 * Служебные события
 */
export enum Event {

    /**
     * Вызывается, когда оппонент отключается
     */
    ON_OPPONENT_DISCONNECT = "opponent_disconnect",
    /**
     * Вызывается, когда соединение с оппонентом установлено 
     */
    ON_OPPONENT_CONNECT = "opponent_connect",
    /**
     * Общая шина данных ответов на соединение (вызывается когда соединение запрошено, отклонено, и вообще 
     * по всем известным причинам описанным в ConnectResponse.ts)
     */
    ON_CONNECT_PROCESS = "connect_process",
    /**
     * Вызывается, когда другая сторона отклонила Ваш запрос на соединение
     */
    ON_CONNECT_DISCARDED = "connect_discarded",



}