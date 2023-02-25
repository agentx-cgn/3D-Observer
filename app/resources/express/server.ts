
import express from 'express'
// import axios, { AxiosResponse } from 'axios'
import cors from 'cors'
import bodyParser from 'body-parser';
import log from 'electron-log'
// import fs from 'fs'
// import path from 'path';
// import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import { AddressInfo } from 'node:net';

import { IConfig } from '../../interfaces';
import Bus from '../../bus';
import apiRouter from './api-router';
import { Actions } from './actions'

dotenv.config()
Object.assign(console, log.functions)
log.transports.file.level = 'silly'

const preConfig = {
  api: {
    port: 0,
    ip: '127.0.0.1',
    protocol: 'http',
    root: '',
    family: ''
  },
}

let
  config: null | IConfig = null,
  actions: any
;

class App {

  private app: express.Application
  private router: express.Router

  private bus: Bus

  constructor() {

    // Prepare Express

    this.app    = express();
    this.router = express.Router();
    this.app.use(cors());
    this.app.use(express.json())
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));

    this.app.use((err, req, res, next) => {

      const { start, httpStatus, message, previousError, stack } = err;

      console.warn('EX.error', httpStatus, message);

      res.status(httpStatus || 406).json({
        status: false,
        code: httpStatus || 406,
        message,
        data: previousError
      });

    });

    // Prepare Bus and wait for config

    this.bus = new Bus('express', 'electron', process);

    this.bus.on('config', (msg) => {

      config  = Object.assign({}, msg.payload, preConfig);
      actions = Actions(config).listen(this.bus);

      this.activate().then( (adr: AddressInfo) => {

        config.api.port   = adr.port;
        config.api.ip     = adr.address;
        config.api.family = adr.family;

        const api = config.api;
        config.api.root = `${api.protocol}://${api.ip}:${api.port}/`;

        this.bus.emit({
          topic:    'config',
          receiver: 'electron',
          payload:   config
        });

      })

    });

  }

  // loadData () {

  //   const cfg = config;

  //   try {

  //     console.log('EXP.JSON.trying...', cfg.fileServers);
  //     const initServers = JSON.parse(fs.readFileSync(cfg.fileServers, 'utf8'));
  //     console.log('EXP.JSON.success', initServers.length, 'servers');

  //     console.log('TEST', path.resolve(String(process.resourcesPath),  'app/resources/express/data/database.db3'));
  //     console.log('EXP.DB.trying...', cfg.fileDBSource);
  //     let db = new sqlite3.Database(cfg.fileDBSource, sqlite3.OPEN_READWRITE, (err) => {
  //       if (err) {
  //         console.error('EX.DB.error', err.message);
  //       } else {
  //         console.log('EXP.DB.success');
  //       }
  //     });

  //     db.each('SELECT domain FROM domains LIMIT 3;', (err, row) => {
  //       err && console.error(err.message);
  //       console.log(row.domain);
  //     });


  //   } catch (err) {
  //     console.error('EX.DB.loadData.error', err);

  //   }

  // }

  activate () {

    return new Promise<any>((resolve, reject) => {

      const cfg = config;

      // to debug lost messages
      // process.on('message', (msg) => {
      //   console.log('EXP.message', msg);
      // });

      // most basic end point
      this.app.use(this.router.get('/', (req, res) => {
        res.json({ express: `API works on ${cfg.api.ip}:${cfg.api.port}` });
      }));

      // exposed API
      this.app.use('/api', apiRouter);

      // start listening
      const server = this.app.listen(preConfig.api.port, preConfig.api.ip, () => {
        const adr = (server.address() as AddressInfo);
        console.log(`EX.listening on`, adr.address, adr.port);
        resolve(adr);
      });

      // log routes to console
      let route: any, routes = [];
      this.app._router.stack.forEach(function(middleware){
        if(middleware.route){ // routes registered directly on the app
          routes.push(middleware.route);
        } else if(middleware.name === 'router'){ // router middleware
          middleware.handle.stack.forEach(function(handler: any){
            route = handler.route;
            route && routes.push(route);
          });
        }
      });

      console.log('EXP.activated', routes.map( r => ({ p: r.path, m: r.methods })));

    });

  }

  middleware () {
    this.app.use(cors());
    this.app.use(express.json())
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  errorHandlerMdw () {

    this.app.use((err, req, res, next) => {

      const { start, httpStatus, message, previousError, stack } = err;

      res.status(httpStatus || 406).json({
        status: false,
        code: httpStatus || 406,
        message,
        data: previousError
      });

    });

  }

}

export default new App();
