/* eslint-disable space-before-function-paren */
import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  public childProcess: typeof childProcess;
  public ipcRenderer:  typeof ipcRenderer;

  private fs:           typeof fs;
  private webFrame:     typeof webFrame;

  constructor () {

    console.log('ElectronService', this.isElectron ? 'Electron found' : 'Electron not found');

    this.init();

    window.onmessage = (event) => {

      console.log('ElectronService.onmessage', event);

      // event.source === window means the message is coming from the preload
      // script, as opposed to from an <iframe> or other source.
      if (event.source === window && event.data === 'main-world-port') {

        const [ port ] = event.ports;

        // Once we have the port, we can communicate directly with the main process.
        port.onmessage = (e: any) => {

          if ( e.data.ping) {

            console.log('ElectronService', 'ping message', e.data);
            port.postMessage({ ping: e.data.ping * 2 });

          } else if (e.data.config) {

            const config = e.data.config;
            console.log('ElectronService', 'config message', e.data);

            fetch(`http://127.0.0.1:${config.port}`)
              .then(r => r.json())
              .then( json => {
                console.log('ElectronService', json);
              })
            ;

          } else {
            console.log('ElectronService', 'unknown message', e.data);

          }
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

      this.childProcess = window.require('child_process');
      this.childProcess.exec('uname -a', (error, stdout, stderr) => {
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
