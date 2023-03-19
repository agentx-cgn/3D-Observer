import { Subject, Subscription } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import EventEmitter from 'node:events';

import { IMessage, TMsgFilter, TMessage, TPayload, TReceiver, TSender, TTopic, TMessenger } from './interfaces';

const DEBUG = false;

class Bus {

  static connect(bus1: Bus, bus2: Bus): void {

    bus1.on<TMessage>( (msg: TMessage) => msg.receiver === bus2.target, (msg: TMessage) => {
      DEBUG && console.log('BUS.forwarding', msg.sender, '=>', msg.receiver);
      bus2.emit<TMessage>(msg, true);
    });

    bus2.on<TMessage>( (msg: TMessage) => msg.receiver === bus1.target, (msg: TMessage) => {
      DEBUG && console.log('BUS.forwarding', msg.sender, '=>', msg.receiver);
      bus1.emit<TMessage>(msg, true);
    });

    DEBUG && console.log('BUS.connected', bus1.target, '<=>', bus2.target);

  }

  public source: TSender;
  public target: TReceiver;

  private messages$ = new Subject<TMessage>();
  private connector: NodeJS.Process | EventEmitter | MessagePort | any;

  constructor (source: TSender, target: TReceiver, connector) {

    DEBUG && console.log(`BUS.${source}.constructor`, '=>', target);

    this.source    = source;
    this.target    = target;
    this.connector = connector;

    if (source === 'electron' && target === 'browser') {
      connector.on('message', (event: MessageEvent) => {
        DEBUG && console.log(`BUS.${this.source}.connector.on`, event.data.topic);
        this.messages$.next(event.data);
      });
      connector.start();

    } else if (
      source === 'electron' && target === 'express' ||
      source === 'express'  && target === 'electron'
      ) {
      connector.on('message', (msg) => {
        DEBUG && console.log(`BUS.${this.source}.connector.on`, msg.topic);
        this.messages$.next(msg);
      });

    } else if (source === 'browser' && target === 'electron') {
      connector.onmessage = (event: MessageEvent) => {
        DEBUG && console.log(`BUS.${this.source}.connector.on`, event.data.topic);
        this.messages$.next(event.data);
      };

    }

  }

  // shorthand for .emit()
  send<T extends TMessage>(topic: T['topic'], receiver: TMessenger, payload: T['payload']) {
    this.emit<T>({
      topic,
      receiver,
      payload
    } as T);
  }

  emit<T extends TMessage>(msg: T, bridge=false) {

    DEBUG && console.log(`BUS.${this.source}.emit`, msg.topic, '=>', msg.receiver);

    !bridge && (msg.sender = this.source);

    if (this.source === 'browser') {
      if (msg.receiver === 'browser') {
        this.messages$.next(msg);
      } else {
        console.log(`BUS.${this.source}.connector`, msg.sender, '=>', msg.receiver, msg.topic);
        this.connector.postMessage(msg);
      }

    } else if (this.source === 'electron') {
      if (msg.receiver === 'electron') {
        this.messages$.next(msg);

      } else if (msg.receiver === 'browser') {
        console.log(`BUS.${this.source}.connector`, msg.sender, '=>', msg.receiver, msg.topic);
        this.connector.postMessage(msg);

      } else {
        console.log(`BUS.${this.source}.connector`, msg.sender, '=>', msg.receiver, msg.topic);
        (this.connector as NodeJS.Process).send(msg);
      }

    } else if (this.source === 'express') {
      if (msg.receiver === 'express') {
        this.messages$.next(msg);
      } else {
        console.log(`BUS.${this.source}.connector`, msg.sender, '=>', msg.receiver, msg.topic);
        (this.connector as NodeJS.Process).send(msg);
      }


    } else {
      console.warn('BUS:WTF');

    }

  }

  on<T extends TMessage>(msgFilter: T['topic'] | TMsgFilter, action: (msg: T) => void): Subscription {

    const tapper = (msg: T) => {
      DEBUG && console.log('BUS.tap', this.source, msg.topic, msg.sender, '=>', msg.receiver);
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
          filter( (msg: T) => msg.topic === msgFilter ),
          tap( tapper )
        )
        .subscribe( action )
      ;

    }

  }


}

export default Bus;
