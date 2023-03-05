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
          this.created$.next(true)
          resolve(bus);

        } else {
          // other stupid messages
          console.log('APP.onmessage.other', event.data);

        }
      };

    });



  }

  // shortcut local emit
  async fire (topic: TTopic, payload: TPayload) {
    (await this.bus).emit({
      topic,
      receiver: 'browser',
      payload
    });
  }

  // shortcut gloabl emit
  async send (topic: TTopic, receiver: TReceiver, payload: TPayload) {
    (await this.bus).emit({
      topic,
      receiver,
      payload
    });
  }

  // generic emit
  async emit(msg: IMessage<TPayload>) {
    (await this.bus).emit(msg);
  }

  // generic on
  async on(topic: TTopic, action: any): Promise<Subscription> {
    return (await this.bus).on(topic, action);
  }

}
