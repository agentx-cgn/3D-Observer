/* eslint-disable no-underscore-dangle */
import { Injectable } from '@angular/core';

import { Subscription } from 'rxjs';
import { IMessage, TPayload } from '../../../app/interfaces';
import Bus from '../../../app/bus';

@Injectable({
  providedIn: 'root'
})
export class BusService {

  private bus: Bus | undefined;

  constructor() { }

  create(name: string, type, connector): Bus {
    this.bus = new Bus(name, type, connector);
    return this.bus;
  }

  emit(msg: IMessage<TPayload>) {
    this.bus.emit(msg);
  }

  on(topic: string, action: any): Subscription {
    return this.bus.on(topic, action);
  }


}
