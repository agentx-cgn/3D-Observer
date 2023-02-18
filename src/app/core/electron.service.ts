/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable space-before-function-paren */
import { Injectable } from '@angular/core';

import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { BusService } from './bus.service';
import { TemplateMiddle } from 'typescript/lib/tsserverlibrary';
import { IConfig, IMessage } from '../../../app/interfaces';
import Bus from '../../../app/bus';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  public config: IConfig = {
    api: {
      root: '',
      port: NaN,
      ip: '',
      protocol: '',
    }
  };

  public childProcess: typeof childProcess;
  public ipcRenderer:  typeof ipcRenderer;

  private fs:           typeof fs;
  private webFrame:     typeof webFrame;

  private bus: Bus;

  constructor (
    private readonly busService: BusService,
  ) {

    console.log('ElectronService', this.isElectron ? 'Electron found' : 'Electron not found');

    this.init();

    window.onmessage = (event) => {

      console.log('ElectronService.onmessage', event.data);

      // event.source === window means the message is coming from the preload
      // script, as opposed to from an <iframe> or other source.
      if (event.source === window && event.data === 'main-world-port') {

        const [ port ] = event.ports;

        // init bus on first message
        this.bus = this.busService.create('browser', 'mainport', port);

        // Once we have the port, we can communicate directly with the main process.
        port.onmessage = (msg: IMessage<any>) => {

          this.bus.emit(msg);

          this.bus.on('ping', (msg: IMessage<number>) => {
            this.bus.emit({ ...msg,
              receiver: msg.sender,
              payload:  msg.payload * 2
            });
          });

          this.bus.on('config', (msg: IMessage<IConfig>) => {

            const cfg = Object.assign(this.config, msg.payload);
            cfg.api.root = `${cfg.api.protocol}://${cfg.api.ip}:${cfg.api.port}/`;

            if (msg.payload.api.port) {

              fetch(cfg.api.root)
                .then(r => r.json())
                .then( json => {
                  console.log('ElectronService', json);
                })
                .catch(err => {
                  console.warn('ElectronService.failed', cfg.api.root, err);
                })
              ;

            }

          });

          // if ( e.data.ping) {

          //   console.log('ElectronService', 'ping message', e.data);
          //   port.postMessage({ ping: e.data.ping * 2 });

          // } else if (e.data.config) {

          //   const config = e.data.config;
          //   const apiurl = `http://127.0.0.1:${config.port}/`;
          //   console.log('ElectronService', 'config message', e.data);

          //   fetch(apiurl)
          //     .then(r => r.json())
          //     .then( json => {
          //       console.log('ElectronService', json);
          //     })
          //     .catch(err => {
          //       console.warn('ElectronService.failed', apiurl, err);
          //     })
          //   ;

          // } else {
          //   console.log('ElectronService', 'unknown message', e.data);

          // }

        };






      }
    };

  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  init () {

    // Conditional imports
    if (this.isElectron) {

      this.fs          = window.require('fs');
      this.webFrame    = window.require('electron').webFrame;
      this.ipcRenderer = window.require('electron').ipcRenderer;

      ipcRenderer.on('ping', (event, message) => {
        // console.log('ElectronService.ping', event, message);
        console.log('ElectronService.ping', message);
      });

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
      require('child_process').exec('uname -a', (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout:${stdout}`);
      });

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