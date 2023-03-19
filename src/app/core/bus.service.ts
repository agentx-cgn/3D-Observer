import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { TMessage, TMessenger } from '../../../app/interfaces';
import Bus from '../../../app/bus';

@Injectable({
  providedIn: 'root'
})
export class BusService {

  public created$ = new Subject<boolean>();

  private bus: Promise<Bus>;

  constructor () {

    this.bus = new Promise( (resolve, reject) => {

      window.onmessage = (event: any) => {

        // event.source === window means the message is coming from the preload
        // script, as opposed to from an <iframe> or other source.
        if (event.source === window && event.data === 'main-world-port') {

          console.log('APP.onmessage.ports', event.data, event.ports[0]);

          const [ port ]: [any] = event.ports;

          // init bus on first message
          const bus = new Bus('browser', 'electron', port);
          this.created$.next(true);
          resolve(bus);

        } else {
          // other stupid messages
          console.log('APP.onmessage.other', event.data);

        }
      };

    });

  }

  // shortcut local emit
  async fire<T extends TMessage>(topic: T['topic'], payload: T['payload']) {
    (await this.bus).emit<T>({
      topic,
      receiver: 'browser',
      payload
    } as T);
  }

  // shortcut global emit
  async send<T extends TMessage>(topic: T['topic'], receiver: TMessenger, payload: T['payload']) {
    (await this.bus).emit<T>({
      topic,
      receiver,
      payload
    } as T);
  }

  // generic emit
  async emit<T extends TMessage>(msg: T) {
    (await this.bus).emit<T>(msg);
  }

  // generic on
  // async on1<T extends TPayload>(topic: TTopic, action: (msg: IMessage<T>) => void): Promise<Subscription> {
  //   return (await this.bus).on(topic, action);
  // }

  async on<T extends TMessage>(topic: T['topic'], action: (msg: T) => void): Promise<Subscription> {
    return (await this.bus).on<T>(topic, action);
  }

}
