/* eslint-disable space-before-function-paren */
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { environment } from '../environments/environment';
import { BusService } from './core/bus.service';
import { IConfig, IMResServerStats, IMConfig, IMGraphData, IMSetTab } from '../../app/interfaces';
import { ForceService } from './pages/force/force.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  public config: null | IConfig = null;

  constructor (
    public force: ForceService,
    private bus: BusService,
    private translate: TranslateService,
  ) {

    console.log('APP.Env', JSON.stringify(environment));

    this.translate.setDefaultLang('en');

    this.bus.created$
      .pipe(filter(Boolean))
      .subscribe( this.listen.bind(this) )
    ;

  }

  // public onStart () {}
  // public onStop () {}

  public onClear () {
    this.force.clear();
  }

  public onZoom  () {
    this.force.zoomToFit();
  }

  public async onSave  () {
    const { nodes, links } = this.force.export();
    this.bus.send<IMGraphData>('set:graphdata', 'express', { nodes, links });
  }

  public onLoad () {
    this.bus.send<IMGraphData>('get:graphdata', 'express', null);
  }

  // public onRequest () {

  //   this.bus.send('request', 'express', {
  //     domain:   'mastodon.online',
  //     endpoint: '/v1/api/peers'
  //   });

  // }

  private listen () {

    // this.bus.on<IResStatsServer>('stats.server', msg => {
    this.bus.on<IMResServerStats>('res:server:stats', msg => {
      console.log('APPComp.stats.server', msg.payload);
      this.bus.fire<IMSetTab>('set:tab:1', msg.payload);
    });

    // this.bus.on<IApiResponse>('response', msg => {
    //   console.log('APPComp.response', msg);
    // });

    // config with api info, should be already in pipeline
    this.bus.on<IMConfig>('config', msg => {

      this.config = Object.assign({}, msg.payload);

      console.log('APP.config', this.config);

      // try out api...
      fetch(this.config.api.root)
        .then(r => r.json())
        .then( async json => {

          console.log('%cAPP.fetched', '{ color: darkgreen; font-weight: 800 }', JSON.stringify(json));

          this.bus.send('ack', 'electron', 'ack.payload');

        })
        .catch(err => {
          console.warn('APP.fetch.failed', this.config.api.root, err);
        })
      ;

    });

  }




}
