/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable space-before-function-paren */
import { Injectable } from '@angular/core';

// import { ipcRenderer, webFrame } from 'electron';
// import * as childProcess from 'child_process';
// import * as fs from 'fs';

import { IConfig, IMessage } from '../../../app/interfaces';
import Bus from '../../../app/bus';

import { BusService } from './bus.service';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  public config: null | IConfig = null;

  // public childProcess: typeof childProcess;
  // public ipcRenderer:  typeof ipcRenderer;

  // private fs:           typeof fs;
  // private webFrame:     typeof webFrame;

  private bus: Bus;

  constructor (
    private readonly busService: BusService,
  ) {

    console.log('ElectronService', this.isElectron ? 'Electron found' : 'Electron not found');

    this.init();

    window.onmessage = (event) => {

      // event.source === window means the message is coming from the preload
      // script, as opposed to from an <iframe> or other source.
      if (event.source === window && event.data === 'main-world-port') {

        console.log('ElectronService', event.data, event.ports[0]);

        const [ port ]: [any] = event.ports;

        // init bus on first message
        this.bus = this.busService.create('browser', 'clientport', port);

        this.bus.on('config', (msg: IMessage<IConfig>) => {

          this.config = Object.assign({}, msg.payload);

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

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  init () {

    // Conditional imports
    if (this.isElectron) {

      // this.fs          = window.require('fs');
      // this.webFrame    = window.require('electron').webFrame;
      // this.ipcRenderer = window.require('electron').ipcRenderer;

      // ipcRenderer.on('ping', (event, message) => {
      //   // console.log('ElectronService.ping', event, message);
      //   console.log('ElectronService.ping', message);
      // });

      // testing command line
      // this is ugly, improve:
      // https://stackoverflow.com/questions/30763496/how-to-promisify-nodes-child-process-exec-and-child-process-execfile-functions
      // this.childProcess = window.require('child_process');
      // this.childProcess.exec('node -v', (error, stdout, stderr) => {
      //   if (error) {
      //     console.error(`error: ${error.message}`);
      //     return;
      //   }
      //   if (stderr) {
      //     console.error(`stderr: ${stderr}`);
      //     return;
      //   }
      //   console.log(`stdout:${stdout}`);
      // });

      // this.childProcess = window.require('child_process');
      // const cmd = 'uname -a';
      // require('child_process').exec(cmd, (error, stdout, stderr) => {
      //   if (error) {
      //     console.error(`error: ${error.message}`);
      //     return;
      //   }
      //   if (stderr) {
      //     console.error(`stderr: ${stderr}`);
      //     return;
      //   }
      //   console.log(`CMD: ${cmd}`, `${stdout}`);
      // });

      // Notes :
      // * A NodeJS's dependency imported with 'window.require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
    }

  }

}
