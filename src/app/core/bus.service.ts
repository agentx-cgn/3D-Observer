/* eslint-disable no-underscore-dangle */
import { Injectable } from '@angular/core';

import { Subscription } from 'rxjs';
import { IMessage, TPayload, TSender } from '../../../app/interfaces';
import Bus from '../../../app/bus';

@Injectable({
  providedIn: 'root'
})
export class BusService {

  private bus: Bus | undefined;

  constructor() { }

  create(name: TSender, type, connector): Bus {
    this.bus = new Bus(name, type, connector);
    return this.bus;
  }

  emit(msg: IMessage<TPayload>) {
    console.log('BusService.emit', msg.payload);
    this.bus.emit(msg);
  }

  on(topic: string, action: any): Subscription {
    return this.bus.on(topic, action);
  }


}
