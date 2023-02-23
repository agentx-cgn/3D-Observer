/* eslint-disable no-underscore-dangle */
import { Injectable } from '@angular/core';

import { Subscription } from 'rxjs';
import { IMessage, TPayload, TReceiver, TSender, TTopic } from '../../../app/interfaces';
import Bus from '../../../app/bus';

@Injectable({
  providedIn: 'root'
})
export class BusService {

  private bus: Bus | undefined;

  create(source: TSender, target: TReceiver, connector): Bus {
    this.bus = new Bus(source, target, connector);
    return this.bus;
  }

  emit(msg: IMessage<TPayload>) {
    console.log('BusService.emit', msg.payload);
    this.bus.emit(msg);
  }

  on(topic: TTopic, action: any): Subscription {
    return this.bus.on(topic, action);
  }

}
