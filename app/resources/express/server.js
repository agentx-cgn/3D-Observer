
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors')
const log         = require('electron-log')
const fs          = require('fs');
const path        = require('path');
const sqlite3     = require('sqlite3').verbose();

const apiRouter   = require('./api-router');

require('dotenv').config();
Object.assign(console, log.functions);
log.transports.file.level = 'silly';


// https://gist.github.com/maximilian-lindsey/a446a7ee87838a62099d
// app.set('views', __dirname + '/client/views');
// app.use(express.static(__dirname + '/client/dist/static'));

let port = 0, apppath, isdev, dbfile;
const ip  = '127.0.0.1';
const datapath = path.join(__dirname, 'data');
// const dbfile   = path.join(datapath, 'observations.sqlite');
const serverfile  = path.join(datapath, 'init-servers.json');

// console.log('EX.starting', {
//   __dirname,
//   ip,
//   datapath,
//   dbfile,
//   serverfile,
//   resourcePath: process.resourcesPath,
//   testPath: path.resolve(process.resourcesPath,  'app/resources/express/data/database.db3')
// });


class App {

  constructor() {

    this.express = express();
    this.router  = express.Router();
    this.middleware();
    this.errorHandlerMdw();

    process.on('message', (msg) => {

      console.log('EX.message', msg);

      if (msg.apppath) {

        apppath = msg.apppath;
        isdev = msg.isdev

        dbfile = isdev
          ? path.join(apppath, 'app', 'resources', 'express', 'data', 'observations.sqlite')
          : path.join(apppath, '', 'resources', 'app.asar.unpacked', 'express', 'data', 'observations.sqlite')
        ;

        this.loadData();
        this.activate();
        console.log('EX.starting', {
          __dirname,
          apppath,
          isdev,
          ip,
          datapath,
          dbfile,
          serverfile,
          resourcePath: process.resourcesPath,
          testPath: path.resolve(String(process.resourcesPath),  'app/resources/express/data/database.db3')
        });

      }
    });


  }

  loadData () {


    try {

      console.log('EX.JSON.trying...', serverfile);
      const initServers = JSON.parse(fs.readFileSync(serverfile, 'utf8'));
      console.log('EX.JSON.success', initServers.length, 'servers');

      console.log('TEST', path.resolve(String(process.resourcesPath),  'app/resources/express/data/database.db3'));
      console.log('EX.DB.trying...', dbfile);
      let db = new sqlite3.Database(dbfile, sqlite3.OPEN_READWRITE, (err) => {
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

    process.on('message', (msg) => {
      console.log('EX.message', msg);
    });

    // most basic end point
    this.express.use(this.router.get('/', (req, res) => {
      res.json({ express: `API works on ${ip}:${port}` });
    }));

    // exposed API
    this.express.use('/api', apiRouter);

    // start listening
    const server = this.express.listen(port, ip, () => {
      port = server.address().port;
      console.log(`EX.listening on ${ip}:${port}`);
      process.send({ port });
    });

    var route, routes = [];

    this.express._router.stack.forEach(function(middleware){
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

  }

  middleware () {
    this.express.use(cors());
    this.express.use(express.json())
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    // const dbCon = require('./setup/db');
    // this.express.locals = { ...this.express.locals, db: dbCon() };
    // this.express.locals.db.sequelize.sync();
  }

  errorHandlerMdw () {

    this.express.use((err, req, res, next) => {

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

// exports.default = new App().express;
exports.default = new App();
