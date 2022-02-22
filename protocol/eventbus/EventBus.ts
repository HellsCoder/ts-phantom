import { EventData } from './EventData';
import { EventMap } from './EventMap';
import { Event } from './Event';

/**
 * Шина событий, можно подписаться на какое нибудь событие - а можно создать свое
 */
export class EventBus {

    private events : EventData[];

    constructor() {
        this.events = [];
    }

    /**
     * Такое сложное выражение создания функции нужно в большей части для автоподсказок при разработке,
     * потому что у каждого соытия - свои аргументы каллбека
     * @param event Событие
     * @param callback Функция, которая вызовется когда событие выполнится
     */
    public on<K extends keyof EventMap>(event : K, callback : EventMap[K]) {
        this.events.push({
            event: event,
            callback : callback
        });
    }

    /**
     * Вызывает событие
     * @param event вызываемое событие
     * @param args аргументы события в соответсктии с EventMap
     */
    public fire(event : Event, ...args : any[]) {
        for(let i = 0; i < this.events.length; i++){
            let eventCall = this.events[i];
            if(event === eventCall.event){
                eventCall.callback.apply(this, args);
            }
        }
    }

}