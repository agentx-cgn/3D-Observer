import { Subject, Subscription, merge } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { IMessage, TBusType, TMsgFilter, TPayload, TSender, TTopic } from './interfaces';
import EventEmitter from 'node:events';

const DEBUG = true;

class Bus {

  static connect(bus1: Bus, bus2: Bus): void {

    bus1.on( (msg: IMessage<TPayload>) => msg.receiver === bus2.name, (msg: IMessage<TPayload>) => {
      bus1.emit(msg);
    });

    bus2.on( (msg: IMessage<TPayload>) => msg.receiver === bus1.name, (msg: IMessage<TPayload>) => {
      bus2.emit(msg);
    });

    console.log('BUS.connected', bus1.name, '<=>', bus2.name);

  }

  public name: TSender;
  public type: TBusType;

  private messages$ = new Subject<IMessage<TPayload>>();

  private connector: NodeJS.Process | EventEmitter | MessagePort | any;

  constructor (name: TSender, type: TBusType, connector) {

    DEBUG && console.log('BUS.constructor', name, type);

    this.name = name;
    this.type = type;
    this.connector = connector;

    if (type === 'mainport') {
      connector.on('message', (event: MessageEvent) => {
        DEBUG && console.log('BUS.connector.on', this.name, event.data.topic);
        this.messages$.next(event.data);
      });
      connector.start();

    } else if (type === 'child' || type === 'process') {
      connector.on('message', (msg) => {
        DEBUG && console.log('BUS.connector.on', this.name, msg.topic);
        this.messages$.next(msg);
      });

    } else if (type === 'clientport') {
      connector.onmessage = (event: MessageEvent) => {
        DEBUG && console.log('BUS.connector.on', this.name, event.data.topic);
        this.messages$.next(event.data);
      };

    }

  }

  emit (msg: IMessage<TPayload>) {

    // console.log('BUS.emit', msg.topic, this.name, '=>', msg.receiver);

    msg.sender = this.name;

    if (this.name === 'browser') {
      if (msg.receiver === 'browser') {
        this.messages$.next(msg);
      } else {
        console.log('BUS.emit.connector', msg.sender, '=>', msg.receiver, msg.topic);
        this.connector.postMessage(msg);
      }

    } else if (this.name === 'electron') {
      if (msg.receiver === 'browser') {
        console.log('BUS.send.connector', msg.sender, '=>', msg.receiver, msg.topic);
        this.connector.postMessage(msg);

      } else {
        console.log('BUS.send.connector', msg.sender, '=>', msg.receiver, msg.topic);
        (this.connector as NodeJS.Process).send(msg);
      }

    } else if (this.name === 'express') {
      if (msg.receiver === 'browser') {
        // this.messages$.next(msg);
      } else {
        console.log('BUS.send.connector', msg.sender, '=>', msg.receiver, msg.topic);
        (this.connector as NodeJS.Process).send(msg);
      }


    } else {
      console.log('BUS:WTF');

    }

  }

  on(msgFilter: TTopic | TMsgFilter, action: any): Subscription {

    const tapper = (msg: any) => {
      console.log('BUS.tap', this.name, msg.topic, msg.sender, '=>', msg.receiver);
    }

    if ( typeof msgFilter === 'function') {
      return this.messages$
        .pipe (



          filter( msgFilter ),
          tap( tapper )
        )
        .subscribe( action )
      ;

    } else {
      return this.messages$
        .pipe(
          filter( (msg: IMessage<TPayload>) => msg.topic === msgFilter ),
          tap( tapper )
        )
        .subscribe( action )
      ;

    }

  }


}

export default Bus;
