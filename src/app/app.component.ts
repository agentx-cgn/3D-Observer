/* eslint-disable space-before-function-paren */
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { environment } from '../environments/environment';
import { BusService } from './core/bus.service';
import { IConfig, IMessage, IApiResponse } from '../../app/interfaces';
import Bus from '../../app/bus';
import { ForceService } from './pages/force/force.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public config: null | IConfig = null;
  private bus: Promise<Bus>;

  constructor(
    private translate: TranslateService,
    private busService: BusService,
    public force: ForceService,
  ) {

    console.log('App.Env', JSON.stringify(environment));

    this.translate.setDefaultLang('en');

    this.bus = new Promise( (resolve, reject) => {

      window.onmessage = (event) => {

        // event.source === window means the message is coming from the preload
        // script, as opposed to from an <iframe> or other source.
        if (event.source === window && event.data === 'main-world-port') {

          console.log('APP.onmessage.ports', event.data, event.ports[0]);

          const [ port ]: [any] = event.ports;

          // init bus on first message
          const bus = this.busService.create('browser', 'electron', port);
          resolve(bus);
          this.listen();

        } else {
          // other stupid messages
          console.log('APP.onmessage.other', event.data);

        }
      };

    });

  }

  public onStart () {}
  public onStop  () {}
  public async onRequest  () {

    (await this.bus).emit({
      receiver: 'express',
      topic: 'request',
      payload: {
        server: 'mastodon.online',
        endpoint: '/v1/api/peers'
      }
    });


  }
  private async listen () {

    (await this.bus).on('response', (msg: IMessage<IApiResponse>) => {
      console.log('APPComp.response', msg);
    });

    // config with api info, should be already in pipeline
    (await this.bus).on('config', (msg: IMessage<IConfig>) => {

      this.config = Object.assign({}, msg.payload);

      // try out api...
      fetch(this.config.api.root)
        .then(r => r.json())
        .then( async json => {

          console.log('%cAPP.fetched', '{ color: darkgreen; font-weight: 800 }', JSON.stringify(json));

          (await this.bus).emit({
            topic: 'ack',
            receiver: 'electron',
            payload: 'ack.payload',
          });

        })
        .catch(err => {
          console.warn('APP.fetch.failed', this.config.api.root, err);
        })
      ;

    });

  }




}
