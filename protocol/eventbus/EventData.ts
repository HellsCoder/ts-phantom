import { Event } from "./Event";

/**
 * Экземпляр события
 */
export interface EventData {
    event : Event | string;
    callback : Function;
}