import { Pipe } from './../../pipe/Pipe';
/**
 * Абстрактный класс потока выполнения N(системных) пакетов, которые принимаются всеми 
 * сторонами (и клиентом и сервером). Потоки выполнения разделяют ЛОГИКУ выполнения пакетов 
 * в зависимости от того, в каком режиме работает протокол
 */
export abstract class NInvokerThread {

    public pipe : Pipe;

    constructor(pipe : Pipe){
        this.pipe = pipe;
    }

    public abstract asClient(packet : any);
    public abstract asServer(packet : any);

}