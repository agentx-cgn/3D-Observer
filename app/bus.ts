import { Subject, Subscription, merge } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { IMessage, TBusType, TPayload, TSender } from './interfaces';
import EventEmitter from 'node:events';

const DEBUG = true;

class Bus {

  private name: TSender;
  private messages$ = new Subject<IMessage<TPayload>>();

  private connector: NodeJS.Process | EventEmitter | MessagePort | any;
  private type: TBusType;

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

  on(topic: string, action: any): Subscription {

    return this.messages$
      .pipe(
        filter( (msg: IMessage<TPayload>) => msg.topic === topic ),
        tap( (msg: any) => {
          console.log('BUS.onTap', this.name, msg.topic, msg.sender, '=>', msg.receiver);
        })
      )
      .subscribe( action )
    ;

  }

}

export default Bus;
