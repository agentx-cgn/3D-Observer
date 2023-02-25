/* eslint-disable no-underscore-dangle */
import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { IMessage, TPayload, TReceiver, TSender, TTopic } from '../../../app/interfaces';
import Bus from '../../../app/bus';

@Injectable({
  providedIn: 'root'
})
export class BusService {

  // private bus: Bus | undefined;

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
          // bus = this.create('browser', 'electron', port);
          const bus = new Bus('browser', 'electron', port);;
          this.created$.next(true)
          resolve(bus);
          // this.listen();

        } else {
          // other stupid messages
          console.log('APP.onmessage.other', event.data);

        }
      };

    });



  }

  // create(source: TSender, target: TReceiver, connector): Bus {
  //   this.bus = new Bus(source, target, connector);
  //   return this.bus;
  // }

  async emit(msg: IMessage<TPayload>) {
    console.log('BusService.emit', msg.payload);
    (await this.bus).emit(msg);
  }

  async on(topic: TTopic, action: any): Promise<Subscription> {
    return (await this.bus).on(topic, action);
  }

}
