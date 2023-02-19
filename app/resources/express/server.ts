import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser';

import log from 'electron-log'
import fs from 'fs'
import path from 'path';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import Bus from '../../bus';
import { IConfig } from '../../interfaces';
import { AddressInfo } from 'node:net';

import apiRouter from './api-router';

dotenv.config()
Object.assign(console, log.functions);
log.transports.file.level = 'silly';

const preConfig = {
  api: {
    port: 0,
    ip: '127.0.0.1',
    protocol: 'http',
    root: '',
    family: ''
  },
  pathData: path.join(__dirname, 'data'),
  fileServers: path.join(__dirname, 'data', 'init-servers.json'),
  fileDB: '',
}

let
  config: null | IConfig = null
;

// const sqlite3     = require('sqlite3').verbose();

class App {

  private app: express.Application
  private router: express.Router

  private bus: Bus

  constructor() {

    this.app = express();
    this.router  = express.Router();
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

    this.bus = new Bus('express', 'process', process);

    this.bus.on('config', (msg) => {

      config = Object.assign({}, msg.payload, preConfig);

      config.fileDB = config.isDev
        ? path.join(config.pathApp, 'app', 'resources', 'express', 'data', 'observations.sqlite')
        : path.join(config.pathApp, '', 'resources', 'app.asar.unpacked', 'express', 'data', 'observations.sqlite')
      ;

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




    // this.middleware();
    // this.errorHandlerMdw();

    // wait for first message
    // process.on('message', (msg: any) => {

    //   console.log('EX.process.message', msg);

    //   if (msg.topic === 'config') {

    //     config = msg.payload;

    //     preConfig.fileDB = config.isDev
    //       ? path.join(config.pathApp, 'app', 'resources', 'express', 'data', 'observations.sqlite')
    //       : path.join(config.pathApp, '', 'resources', 'app.asar.unpacked', 'express', 'data', 'observations.sqlite')
    //     ;

    //     this.activate().then( (adr: AddressInfo) => {

    //       preConfig.api.port   = adr.port;
    //       preConfig.api.ip     = adr.address;
    //       preConfig.api.family = adr.family;

    //       config = Object.assign(config, preConfig);

    //       // this.bus = new Bus('express', 'process', process);

    //       console.log('EX.config', config);
    //       console.log('EX.-------------------------');

    //       // this.bus.emit({
    //       //   topic: 'config',
    //       //   receiver: 'electron',
    //       //   payload: config,
    //       // });

    //       // this.bus.on('config', (msg) => {
    //       //   const cfg = msg.config;
    //       // });

    //     });

    //   }

    // });

  }

  // startListening () {

  //   return new Promise( (resolve, reject) => {


  //   })



  // }


  loadData () {

    const cfg = config;


    try {

      console.log('EX.JSON.trying...', cfg.fileServers);
      const initServers = JSON.parse(fs.readFileSync(cfg.fileServers, 'utf8'));
      console.log('EX.JSON.success', initServers.length, 'servers');

      console.log('TEST', path.resolve(String(process.resourcesPath),  'app/resources/express/data/database.db3'));
      console.log('EX.DB.trying...', cfg.fileDB);
      let db = new sqlite3.Database(cfg.fileDB, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error('EX.DB.error', err.message);
        } else {
          console.log('EX.DB.success');
        }
      });

      db.each('SELECT domain FROM domains LIMIT 3;', (err, row) => {
        err && console.error(err.message);
        console.log(row.domain);
      });


    } catch (err) {
      console.error('EX.DB.loadData.error', err);

    }


  }

  activate () {

    return new Promise<any>((resolve, reject) => {

      const cfg = config;

      process.on('message', (msg) => {
        console.log('EX.message', msg);
      });

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
        // process.send({ port });
        resolve(adr);
      });

      var route, routes = [];

      this.app._router.stack.forEach(function(middleware){
        if(middleware.route){ // routes registered directly on the app
          routes.push(middleware.route);
        } else if(middleware.name === 'router'){ // router middleware
          middleware.handle.stack.forEach(function(handler){
            route = handler.route;
            route && routes.push(route);
          });
        }
      });

      console.log('EX.activated', routes.map( r => ({ p: r.path, m: r.methods })));

    });

  }

  middleware () {
    this.app.use(cors());
    this.app.use(express.json())
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    // const dbCon = require('./setup/db');
    // this.express.locals = { ...this.express.locals, db: dbCon() };
    // this.express.locals.db.sequelize.sync();
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

  // async routes () {

  //   let router = express.Router();

  //   router.get('/', (req, res, next) => {
  //     res.send({ express: `API works on ${ip}:${port}` });
  //   });

  //   this.express.use('/', router);

  // }

}

export default new App();
