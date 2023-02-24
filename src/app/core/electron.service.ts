/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable space-before-function-paren */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  constructor (
  ) {
    console.log('ElectronService', 'Electron', this.isElectron ? 'found' : 'not found');
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

}
