/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable space-before-function-paren */
import { Injectable } from '@angular/core';
import { IConfig, IMessage } from '../../../app/interfaces';
import Bus from '../../../app/bus';
import { BusService } from './bus.service';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  public busPromise: Promise<Bus>;
  // public config: null | IConfig = null;
  private bus: Bus;


  constructor (
    private readonly busService: BusService,
  ) {

    console.log('ElectronService', 'Electron', this.isElectron ? 'found' : 'not found');

    // this.init();

  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  // init () {

  //   this.busPromise = new Promise( (resolve, reject) => {

  //     window.onmessage = (event) => {

  //       // event.source === window means the message is coming from the preload
  //       // script, as opposed to from an <iframe> or other source.
  //       if (event.source === window && event.data === 'main-world-port') {

  //         console.log('ElectronService', event.data, event.ports[0]);

  //         const [ port ]: [any] = event.ports;

  //         // init bus on first message
  //         this.bus = this.busService.create('browser', 'clientport', port);
  //         resolve(this.bus);


  //       } else {
  //         // other stupid messages
  //         console.log('ElectronService.onmessage', event.data);

  //       }
  //     };

  //   });

  // }

}
