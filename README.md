![Иллюстрация к проекту](https://raw.githubusercontent.com/HellsCoder/ts-phantom/main/ts-phantom.png)
# ts-phantom
Сетевой движок с реализацией пакетов и обязательного шифрования, пакеты передаются моментально

# Как это работает
Пара слов о том, как это работает. Почему на сервере практически не требуется никакого кода? Все дело в архитектуре движка и протокола в целом. Это прежде всего **P2P-протокол** (peer-to-peer), по этому сервер выполняет лишь роль связиста и [ретранслятора данных](https://github.com/HellsCoder/ts-phantom/blob/5ad3cd6c2abee7cebac8ed88bd63a7703cebf5c0/protocol/pipe/sides/ServerFactory.ts#L115) которые отправляет ему пользователь, все эти [данные зашифрованны](https://github.com/HellsCoder/ts-phantom/blob/5ad3cd6c2abee7cebac8ed88bd63a7703cebf5c0/protocol/pipe/sides/ServerFactory.ts#L115), сервер их не хранит (смотреть исходный код) и не может прочитать (кроме системных пакетов).

У каждого пользователя при подключении к серверу - появляется свой ConnectionID (буквенно-цифровой ID из [6 латинских букв и чисел](https://github.com/HellsCoder/ts-phantom/blob/5ad3cd6c2abee7cebac8ed88bd63a7703cebf5c0/protocol/connection/ConnectionManager.ts#L80) с нуля до девяти \[a-zA-Z0-9\]), этот ConnectionID **пользователь A** любым путем связи (хоть почтовым голубем) сообщает **пользователю B**, после этого **пользователь B** инициализирует соединение с помощью специальной функции которая описана в этом документе, далее, после того, как соединение инициализировано, необходимо чтобы другая сторона, в данном случае **пользователь А**, принял запрос на соединение. ТОЛЬКО после того, как запрос на соединение принят другой стороной - создается **КАНАЛ**, по которому пользователи общаются. После того, как соединение создано - пользователям необходимо сделать одинаковый ключ шифрования (опять же, **пользователь A** может сообщить где угодно ключ шифрования **пользователю B**, возможно даже в завуалированном формате, например: слушай, а скажи свой пароль от вк? - XXX09A19D91DADERI. Когда кто-то будет пытаться расшифровать Ваши сообщения, например провайдер трафика, он даже не поймет как они зашифрованы)

Все данные по протоколу передаются в двоичном(бинарном) формате, но Вам об это даже не обязательно знать - протокол сам сериализует и десериализует данные по зарегистрированным в нем пакетам.

# Установка
Флаг -d нужен чтобы установить движок в качестве зависимости
```
npm i -d ts-phantom
```

# Сервер
Сервер на Phantom создать очень просто, это займет у Вас буквально две строчки кода
```typescript
import { Phantom } from './protocol/Phantom';
import { ProtocolMode } from './protocol/sock/ProtocolMode';

/**
 * Первый аргумент - режим работы протокола, их всего два CLIENT и SERVER, 
 * нам нужен режим сервера, выбираем ProtocolMode.SERVER
 * Второй аргумент - порт, на котором будет запущен сервер
 */
let server : Phantom = new Phantom(ProtocolMode.SERVER, 7777);
/**
 * Включаем сервер, прослушиваем соединение. Все. На сервере больше ничего не нужно
 */
server.connect();
```
Теперь сервер уже готов принимать и обрабатывать Ваших клиентов.

# Клиент
В первую очередь - нам необходимо установить соединение с сервером, делается это очень просто
```typescript
import { ConnectionID } from './protocol/connection/ConnectionID';
import { Phantom } from './protocol/Phantom';
import { ProtocolMode } from './protocol/sock/ProtocolMode';

/**
 * Первый аргумент - режим протокола, так как в данном случае мы - это клиент, а не сервер
 * выбираем режим CLIENT
 * Второй аргумент - номер порта для соединения(если сервер работает на порте 7777 значит порт 7777)
 * Третий аргумент - адрес до серверной машины по протоколу ws(s), БЕЗ ПОРТА. То есть: если сервер у Вас
 * запущен локально, то адрес будет ws://127.0.0.1. Если ип вашего сервера 91.11.11.22, то адрес будет соответственно ws://91.11.11.22
 */
let client : Phantom = new Phantom(ProtocolMode.CLIENT, 7777, "ws://127.0.0.1");

/**
 * Как и в случае с сервером - необходимо вызвать функцию connect чтобы подключиться к серверу
 * первый и единственный аргумент в которой - это callback функция, которая вызывается, когда соединение с сервером успешно установлено. Она передает нам наш ConnectionID
 */
client.connect(function(id : ConnectionID){
    console.info(`Ура! Мы подключились к серверу. Наш ID ${id}`);
});
```
Запустите сервер, потом запустите клиент, клиентом будет выведено в консоль **(вместо AF83X1 будут [случаные 6 цифр](https://github.com/HellsCoder/ts-phantom/blob/5ad3cd6c2abee7cebac8ed88bd63a7703cebf5c0/protocol/connection/ConnectionManager.ts#L80))**
```
Ура! Мы подключились к серверу. Наш ID AF83X1
```
Отлично! Соединение с сервером установлено! Теперь можно соединиться с другим клиентом(который тоже соединен **с этим сервером**). 
```typescript
client.connect(function(id : ConnectionID){
    console.info(`Ура! Мы подключились к серверу. Наш ID ${id}`);
    /**
     * С помощью вызова функции connect мы можем подключиться к другому пользователю
     * ВАЖНО!! Функцию соединения можно вызывать только после того как получен уже наш ID, то есть желательно в теле этого callbackа
     */
    client.getUserConnector().сonnect("ID_ПОЛЬЗОВАТЕЛЯ");
});

/**
 * Это подписка на событие. Всего событий 4, одно из них - ON_OPPONENT_CONNECT - вызывается, когда сторона, к которой мы применяли функцию client.getUserConnector().сonnect() - приняла наш запрос на соединение. Ровно после этого события можно начать обмен любой информацией с принявшей наше соединение стороной 
 */
client.eventBus.on(Event.ON_OPPONENT_CONNECT, function(id : ConnectionID) {
    console.info(`Соединение с ${id} успешно установлено, можно начинать общаться!`);
});
```
То есть, Вы подключаетесь к серверу - сервер выдает вам ConnectionID, Ваш друг тоже подключается к **ЭТОМУ ЖЕ**(это важно!) серверу, ему тоже выдается ConnectionID, он сообщает его Вам, и Вы с помощю функции описанной выше - соединяетесь с ним. Окей! Но что делать если с клиентом(с нами) хотят соединиться - просто подписываемся на это событие!
```typescript
/**
 * Это событие ON_CONNECT_PROCESS - тут описываются весь процесс соединения. В каллбеке первый аргумент - ид, к которому относится событие, второй аргумент - описание события.
 */
client.eventBus.on(Event.ON_CONNECT_PROCESS, function(id : ConnectionID, response : ConnectResponse){
    if(response === ConnectResponse.CONNECT_THROW){
        /**
         * С нами попытался кто-то соединиться, мы можем принять или отклонить соединение 
         */
        console.info(`С нами хочет соединиться ${id}`);
        /**
         * Принимаем соединение
         */
        client.getUserConnector().accept(); 

        /**
         * Или можем его отклонить client.getUserConnector().cancel();
         */
    }
});
```
После того как мы приняли соединение - мы можем начать общаться. Итого на данный момент у нас получился такой код клиента
```typescript
import { ConnectionID } from './protocol/connection/ConnectionID';
import { Event } from './protocol/eventbus/Event';
import { ConnectResponse } from './protocol/packet/handshake/PacketN2ConnectResponse';
import { Phantom } from './protocol/Phantom';
import { ProtocolMode } from './protocol/sock/ProtocolMode';


let client : Phantom = new Phantom(ProtocolMode.CLIENT, 7777, "ws://127.0.0.1");

client.connect(function(id : ConnectionID){
    /**
     * С сервером соединились, ID получили
     */
    console.info(`Ура! Мы подключились к серверу. Наш ID ${id}`);
    client.getUserConnector().сonnect("ID_ПОЛЬЗОВАТЕЛЯ");
});

/**
 * Отслеживаем весь процесс соединений входящих/исходящих
 */
client.eventBus.on(Event.ON_CONNECT_PROCESS, function(id : ConnectionID, response : ConnectResponse){
    if(response === ConnectResponse.CONNECT_THROW){
        /**
         * С нами попытался кто-то соединиться, мы можем принять или отклонить соединение 
         */
        console.info(`С нами хочет соединиться ${id}`);
        /**
         * Принимаем соединение
         */
        client.getUserConnector().accept(); 
        return;
    }
    if(response === ConnectResponse.DISCARDED){
        /**
         * Когда сторона, с которой мы пытались соединиться - отклоняет наш запрос (функция cancel()) - мы будем уведомлены об этом
         */
        console.info(`${id} отклонил Ваш запрос на соединение!`);
    }
    if(response === ConnectResponse.REQUESTED){
        /**
         * Соединение успешно запрошено (ожидается подтверждение от другой стороны)
         */
        console.info(`Соединение с ${id} успешно запрошено, ждем подтверждение`);
    }
});

/**
 * Когда кто-то принимает наше соединение, либо мы принимаем чье-то соединение - образуется КАНАЛ.
 * Когда обраузется канал с каким-то пользователем, выполняется это событие
 */
client.eventBus.on(Event.ON_OPPONENT_CONNECT, function(id : ConnectionID){
    console.info(`Ура! Мы подключились к пользователю ${id}, можно начинать общаться!`);
});

/**
 * Когда оппонент, с которым у нас был образован канал - отключается, то выполняется это событие
 */
client.eventBus.on(Event.ON_OPPONENT_DISCONNECT, function(id : ConnectionID){
    console.info(`Упс! ${id} отключился от сервера, соединение разорвано`)
});
```
С соединениями все понятно, теперь - отправка данных. Вот пользователь соединился, а дальше то что? А дальше они могут отправлять друг другу произвольные пакеты, и это уже следующий раздел - ОТПРАВКА ДАННЫХ

# Отправка данных
Пакет([Packet](https://github.com/HellsCoder/ts-phantom/blob/5ad3cd6c2abee7cebac8ed88bd63a7703cebf5c0/protocol/packet/Packet.ts)) - минимальная единица данных, которая передается движком. Чтобы отправить какие-то данные по сети - нам нужно создать свой пакет. 

###### Структура пакетов
Все пакеты должны быть унаследованы от родительского класса [Packet](https://github.com/HellsCoder/ts-phantom/blob/5ad3cd6c2abee7cebac8ed88bd63a7703cebf5c0/protocol/packet/Packet.ts). Каждый пакет имеет структуру {ID}{DATA}, где ID - ID пакета, всегда положительное число (отрицательные ID пакетов - системные), и DATA - любые данные пакета. Но первым делом ВСЕГДА идет ID, это протокол. 
[Примеры пакетов](https://github.com/HellsCoder/ts-phantom/tree/5ad3cd6c2abee7cebac8ed88bd63a7703cebf5c0/protocol/packet/handshake), они имеют отрицательный ID, т.к они системные, в нашем же случае мы будем использовать всегда положительный ID.

###### Создадим свой первый пакет
Итак, создадим пакет, который будет передавать любое текстовое сообщение между двумя пользователями
```typescript
import { BitStream, StringByteEncode } from "ts-bitstream";
import { Packet } from "../protocol/packet/Packet";

/**
 * Все пакеты должны быть наследованы(extends) от класса Packet
 * Я всегда добавляю цифру ID пакета в его название, это дело вкуса
 */
export class Packet1Message extends Packet {

    private message : string;

    /**
     * Конструктор пакета. ВСЕГДА ВСЕ АРГУМЕНТЫ должны быть НЕ ОБЯЗАТЕЛЬНЫМИ. Так как пакет могут не
     * только отправлять, но еще и получать. В таком случае аргументы будут недоступны, так как они на тот
     * момент будут еще закодированы. А вот при отправке пакета этот конструктор нам понадобится
     */
    constructor(message? : string){
        super();
        this.message = message;
    }

    /**
     * Обязательная фукнция, унаследованная от Packet. Она должна вернуть ID пакета. ID пакета - любое число
     */
    public getPacketId(): number {
        return 1;
    }

    /**
     * Функция recive срабатывает, когда пакет приходит клиенту 
     */
    public recive(bs: BitStream): Packet {
        /**
         * Читаем наше сообщение, вот по этому аргументы в конструкторе должны быть
         * не обязательными. Потому что поле заполняется только к моменту чтения пакета
         */
        this.message = bs.readString();
        return this;
    }

    /**
     * Эта функция вызывается движом когда пакет отправляется
     */
    public send(): BitStream {
        let bs : BitStream = new BitStream(); //создаем новый битовый поток для пакета
        bs.writeInt(this.getPacketId()); //как и было описано выше - первым делом записываем в пакет его ID, он всегда должен идти первый!
        bs.writeString(this.message, StringByteEncode.AUTOMATIC); //записываем сообщение
        return bs; //возвращаем готовый битовый поток
    }
    
    /**
     * Функция для получения сообщения, которое мы прочли
     */
    public getMessage() : string {
        return this.message;
    }
}
```
В коде встречаются функции связанные с битовыми потоками (writeInt, writeString, readInt, readString), это функции из библиотеки [ts-bitstream](https://github.com/HellsCoder/ts-bitstream), почитайте ее README если эти функции Вам непонятны. Если коротко: все, что они делают это читают определенный тип информации. Битовые потоки используется здесь потому что они очень компактные. Итак, мы создали наш первый пакет.

###### Регистрация пакета
Пакет мы создали, теперь нужно его зарегистрировать, при этом **РЕГИСТРИРОВАТЬ НА СЕРВЕРЕ ЕГО НЕ НУЖНО**, достаточно зарегистрировать только на клиенте, делается это вот так 
```typescript
let client : Phantom = new Phantom(ProtocolMode.CLIENT, 7777, "ws://127.0.0.1");

/**
 * Регистрация пакета. Можно регистрировать его в любом месте, но лучше сразу после получения инстанса Phantom
 */
client.getPacketManager().addPacket(new Packet1Message, function (packet : Packet1Message){
    /**
     * В переменной packet - у нас уже прочитанный и расшифрованный пакет. Вы можете просто обращаться к нему как к объекту
     */
    console.info(`Пришло сообщение: ${packet.getMessage()}`);
});

client.connect(function(id : ConnectionID){
...
```
###### Отправка пакетов
После регистрации пакета он уже полностью готов к отправке, но перед этим, кстати, не забудьте установить клиенту ключ шифрования такой же точно как и у клиента, с которым установлено подключение, это можно сделать так
```typescript
/**
 * Когда кто-то принимает наше соединение, либо мы принимаем чье-то соединение - образуется КАНАЛ.
 * Когда обраузется канал с каким-то пользователем, выполняется это событие
 */
client.eventBus.on(Event.ON_OPPONENT_CONNECT, function(id : ConnectionID){
    console.info(`Ура! Мы подключились к пользователю ${id}, можно начинать общаться!`);

    console.info(`Обмен ключами шифрования`);
    /**
     * На месте ABCDE12345 должен быть ключ шифрования, который используется у другой стороны. Другая сторона может получить свой ключ используя функцию client.getEncryptionKey() и сообщить вам. Но, допустим другая сторона назвала вам этот ключ - значит указываем его.
     */
    client.setEncryptionKey("ABCDE12345");
});
```
Как только обмен ключами шифрования произошел, можно начинать отправлять любые пакеты, давайте отправим пакет который мы только что создали
```typescript
...
client.setEncryptionKey("ABCDE12345");
client.send(new Packet1Message("Приветик!!!"));
...
```
Запускаем сервер, запускаем двух клиентов. И как только они подключатся к друг другу - обоим отправится сообщение
```
Пришло сообщение: Приветик!!!
```
Почему обоим? Потому что событие Event.ON_OPPONENT_CONNECT сработает и у одного клиента, и у второго (так как между ними было установлено соединение), и так как пакет отправляется у нас именно в каллбеке этого события - они отправят его друг другу.

# Весь код клиента
Это весь код клиента
```typescript
//index.ts
import { ConnectionID } from './protocol/connection/ConnectionID';
import { Event } from './protocol/eventbus/Event';
import { ConnectResponse } from './protocol/packet/handshake/PacketN2ConnectResponse';
import { Phantom } from './protocol/Phantom';
import { ProtocolMode } from './protocol/sock/ProtocolMode';
import { Packet1Message } from './testpacket/Packet1Message';


let client : Phantom = new Phantom(ProtocolMode.CLIENT, 7777, "ws://127.0.0.1");

/**
 * Регистрация пакета. Можно регистрировать его в любом месте, но лучше сразу после получения инстанса Phantom
 */
client.getPacketManager().addPacket(new Packet1Message, function (packet : Packet1Message){
    /**
     * В переменной packet - у нас уже прочитанный и расшифрованный пакет. Вы можете просто обращаться к нему как к объекту
     */
    console.info(`Пришло сообщение: ${packet.getMessage()}`);
});

client.connect(function(id : ConnectionID){
    /**
     * С сервером соединились, ID получили
     */
    console.info(`Ура! Мы подключились к серверу. Наш ID ${id}`);
    client.getUserConnector().сonnect("ID_ПОЛЬЗОВАТЕЛЯ");
});

/**
 * Отслеживаем весь процесс соединений входящих/исходящих
 */
client.eventBus.on(Event.ON_CONNECT_PROCESS, function(id : ConnectionID, response : ConnectResponse){
    if(response === ConnectResponse.CONNECT_THROW){
        /**
         * С нами попытался кто-то соединиться, мы можем принять или отклонить соединение 
         */
        console.info(`С нами хочет соединиться ${id}`);
        /**
         * Принимаем соединение
         */
        client.getUserConnector().accept(); 
        return;
    }
    if(response === ConnectResponse.DISCARDED){
        /**
         * Когда сторона, с которой мы пытались соединиться - отклоняет наш запрос (функция cancel()) - мы будем уведомлены об этом
         */
        console.info(`${id} отклонил Ваш запрос на соединение!`);
    }
    if(response === ConnectResponse.REQUESTED){
        /**
         * Соединение успешно запрошено (ожидается подтверждение от другой стороны)
         */
        console.info(`Соединение с ${id} успешно запрошено, ждем подтверждение`);
    }
});

/**
 * Когда кто-то принимает наше соединение, либо мы принимаем чье-то соединение - образуется КАНАЛ.
 * Когда обраузется канал с каким-то пользователем, выполняется это событие
 */
client.eventBus.on(Event.ON_OPPONENT_CONNECT, function(id : ConnectionID){
    console.info(`Ура! Мы подключились к пользователю ${id}, можно начинать общаться!`);

    console.info(`Обмен ключами шифрования`);
    /**
     * На месте ABCDE12345 должен быть ключ шифрования, который используется у другой стороны. Другая сторона может получить свой ключ используя функцию client.getEncryptionKey() и сообщить вам. Но, допустим другая сторона назвала вам этот ключ - значит указываем его.
     */
    client.setEncryptionKey("ABCDE12345");
    client.send(new Packet1Message("Приветик!!!"));
});

/**
 * Когда оппонент, с которым у нас был образован канал - отключается, то выполняется это событие
 */
client.eventBus.on(Event.ON_OPPONENT_DISCONNECT, function(id : ConnectionID){
    console.info(`Упс! ${id} отключился от сервера, соединение разорвано`)
});
```
```typescript
//testpacket/Packet1Message.ts
import { BitStream, StringByteEncode } from "ts-bitstream";
import { Packet } from "../protocol/packet/Packet";

/**
 * Все пакеты должны быть наследованы(extends) от класса Packet
 * Я всегда добавляю цифру ID пакета в его название, это дело вкуса
 */
export class Packet1Message extends Packet {

    private message : string;

    /**
     * Конструктор пакета. ВСЕГДА ВСЕ АРГУМЕНТЫ должны быть НЕ ОБЯЗАТЕЛЬНЫМИ. Так как пакет могут не
     * только отправлять, но еще и получать. В таком случае аргументы будут недоступны, так как они на тот
     * момент будут еще закодированы. А вот при отправке пакета этот конструктор нам понадобится
     */
    constructor(message? : string){
        super();
        this.message = message;
    }

    /**
     * Обязательная фукнция, унаследованная от Packet. Она должна вернуть ID пакета. ID пакета - любое число
     */
    public getPacketId(): number {
        return 1;
    }

    /**
     * Функция recive срабатывает, когда пакет приходит клиенту 
     */
    public recive(bs: BitStream): Packet {
        /**
         * Читаем наше сообщение, вот по этому аргументы в конструкторе должны быть
         * не обязательными. Потому что поле заполняется только к моменту чтения пакета
         */
        this.message = bs.readString();
        return this;
    }

    /**
     * Эта функция вызывается движом когда пакет отправляется
     */
    public send(): BitStream {
        let bs : BitStream = new BitStream(); //создаем новый битовый поток для пакета
        bs.writeInt(this.getPacketId()); //как и было описано выше - первым делом записываем в пакет его ID, он всегда должен идти первый!
        bs.writeString(this.message, StringByteEncode.AUTOMATIC); //записываем сообщение
        return bs; //возвращаем готовый битовый поток
    }
    
    /**
     * Функция для получения сообщения, которое мы прочли
     */
    public getMessage() : string {
        return this.message;
    }
}
```

# Интересный момент
В теле пакетов, в функции отправки, мы записываем первым делом ID, потом остальные данные.
```typescript
public send(): BitStream {
    let bs : BitStream = new BitStream(); //создаем новый битовый поток для пакета
    bs.writeInt(this.getPacketId()); //как и было описано выше - первым делом записываем в пакет его ID, он всегда должен идти первый!
    bs.writeString(this.message, StringByteEncode.AUTOMATIC); //записываем сообщение
    return bs; //возвращаем готовый битовый поток
}
```
А вот при чтении - мы сразу читаем данные. Почему так? Ведь мы записывали ID и данные, а читаем только данные
```typescript
/**
 * Функция recive срабатывает, когда пакет приходит клиенту 
 */
public recive(bs: BitStream): Packet {
    //ОПА!!! НЕ ЧИТАЕМ ИД!!!
    this.message = bs.readString(); //читаем данные
    return this;
}
```
Все дело в том, что внутри класса BitStream есть указатель чтения (readPointer), который смещается определенным образом каждый раз когда мы что-то читаем, и так как [в ядре движка ID пакета уже прочтен](https://github.com/HellsCoder/ts-phantom/blob/main/protocol/channel/invoke/PacketChannelInvoker.ts#L24), то указатель чтения уже сместился на нужную нам позицию, и мы сразу можем читать данные
