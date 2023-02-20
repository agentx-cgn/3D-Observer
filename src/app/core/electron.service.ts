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

  public config: null | IConfig = null;
  private bus: Bus;

  constructor (
    private readonly busService: BusService,
  ) {

    console.log('ElectronService', 'Electron', this.isElectron ? 'found' : 'not found');

    this.init();

  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  init () {

    window.onmessage = (event) => {

      // event.source === window means the message is coming from the preload
      // script, as opposed to from an <iframe> or other source.
      if (event.source === window && event.data === 'main-world-port') {

        console.log('ElectronService', event.data, event.ports[0]);

        const [ port ]: [any] = event.ports;

        // init bus on first message
        this.bus = this.busService.create('browser', 'clientport', port);

        // config with api info, should be already in pipeline
        this.bus.on('config', (msg: IMessage<IConfig>) => {

          this.config = Object.assign({}, msg.payload);

          // try out api...
          fetch(this.config.api.root)
            .then(r => r.json())
            .then( json => {

              console.log('ElectronService.fetched', JSON.stringify(json));

              this.bus.emit({
                topic: 'ack',
                receiver: 'electron',
                payload: 'ack.payload',
              });

            })
            .catch(err => {
              console.warn('ElectronService.failed', this.config.api.root, err);
            })
          ;

        });

      } else {
        // other stupid messages
        console.log('ElectronService.onmessage', event.data);

      }
    };

  }

}
