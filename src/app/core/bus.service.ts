import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { IMessage, TPayload, TReceiver, TTopic } from '../../../app/interfaces';
import Bus from '../../../app/bus';

@Injectable({
  providedIn: 'root'
})
export class BusService {

  public created$ = new Subject<boolean>();

  private bus: Promise<Bus>;

  constructor () {

    this.bus = new Promise( (resolve, reject) => {

      window.onmessage = (event) => {

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
  async fire<T extends TPayload>(topic: TTopic, payload: T) {
    (await this.bus).emit<T>({
      topic,
      receiver: 'browser',
      payload
    });
  }

  // shortcut gloabl emit
  async send<T extends TPayload>(topic: TTopic, receiver: TReceiver, payload: T) {
    (await this.bus).emit<T>({
      topic,
      receiver,
      payload
    });
  }

  // generic emit
  async emit<T extends TPayload>(msg: IMessage<T>) {
    (await this.bus).emit<T>(msg);
  }

  // generic on
  async on(topic: TTopic, action: any): Promise<Subscription> {
    return (await this.bus).on(topic, action);
  }

}
