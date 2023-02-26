/* eslint-disable space-before-function-paren */
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { environment } from '../environments/environment';
import { BusService } from './core/bus.service';
import { IConfig, IMessage, IApiResponse } from '../../app/interfaces';
import { ForceService } from './pages/force/force.service';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public config: null | IConfig = null;
  public camera = '';
  public bounding = '';


  constructor(
    public force: ForceService,
    private bus: BusService,
    private translate: TranslateService,
  ) {

    console.log('App.Env', JSON.stringify(environment));

    this.translate.setDefaultLang('en');

    this.bus.created$
      .pipe(filter( v => v))
      .subscribe( () => {
        this.listen();
      })
    ;

  }

  public onStart () {}
  public onZoom  () {
    this.force.zoomToFit();
  }

  public async onSave  () {

    const { nodes, links } = this.force.export();

    this.bus.emit({
      receiver: 'express',
      topic:    'graphdata.set',
      payload: { nodes, links }
    });

  }

  public onLoad  () {

    this.bus.emit({
      receiver: 'express',
      topic:    'graphdata.get',
      payload:   null
    });
  }

  public onRequest  () {

    this.bus.emit({
      receiver: 'express',
      topic: 'request',
      payload: {
        server: 'mastodon.online',
        endpoint: '/v1/api/peers'
      }
    });

  }

  private listen () {

    this.bus.on('response', (msg: IMessage<IApiResponse>) => {
      console.log('APPComp.response', msg);
    });

    // config with api info, should be already in pipeline
    this.bus.on('config', (msg: IMessage<IConfig>) => {

      this.config = Object.assign({}, msg.payload);

      console.log('App.config', this.config);

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
