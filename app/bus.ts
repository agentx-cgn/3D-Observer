import { Subject, Subscription, merge } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { IMessage, TBusType, TPayload, TSender } from './interfaces';
// import { ChildProcess } from 'node:child_process';
import EventEmitter from 'node:events';

class Bus {

  // // private messagesExpress$ = new Subject<IMessage<TPayload>>();
  // // private messagesBrowser$ = new Subject<IMessage<TPayload>>();
  // private messagesElectron$ = new Subject<IMessage<TPayload>>();

  // private childexpress: ChildProcess;

  // // static fromProcess (process: NodeJS.Process) {

  // //   const bus = new Bus();
  // // }

  private name: TSender;
  private messages$ = new Subject<IMessage<TPayload>>();

  private connector: NodeJS.Process | EventEmitter | MessagePort | any;
  private type: TBusType;

  constructor (name: TSender, type: TBusType, connector) {

    console.log('BUS.constructor', name, type);

    this.name = name;
    this.type = type;
    this.connector = connector;

    if (type === 'mainport') {
      connector.on('message', (event) => {
        console.log('BUS.connector.on', this.name, event.data);
        this.messages$.next(event.data);
      });
      connector.start();

    } else if (type === 'child' || type === 'process') {
      connector.on('message', (msg) => {
        console.log('BUS.connector.on', this.name, 'trying next');
        this.messages$.next(msg);
      });

    } else if (type === 'clientport') {
      connector.onmessage = (event: MessageEvent) => {
        console.log('BUS.connector.on1', this.name, event.data);
        this.messages$.next(event.data);
      };

    }

  }

  emit (msg: IMessage<TPayload>) {

    console.log('BUS.emit', msg.topic, this.name, '=>', msg.receiver);

    msg.sender = this.name;

    if (this.name === 'browser') {
      if (msg.receiver === 'browser') {
        this.messages$.next(msg);
      } else {
        console.log('BUS.send.connector', this.name, msg.payload);
        this.connector.postMessage(msg);
      }

    } else if (this.name === 'electron') {
      if (msg.receiver === 'browser') {
        console.log('BUS.send.connector', this.name, msg.payload);
        this.connector.postMessage(msg);

      } else {
        console.log('BUS.send.connector', this.name, msg.payload);
        (this.connector as NodeJS.Process).send(msg);
      }

    } else if (this.name === 'express') {
      if (msg.receiver === 'browser') {
        // this.messages$.next(msg);
      } else {
        console.log('BUS.send.connector', this.name, msg.payload);
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
          console.log('BUS.tap', this.name, msg.topic, msg.sender, '=>', msg.receiver);
        })
      )
      .subscribe( action );

  }

}

export default Bus;
