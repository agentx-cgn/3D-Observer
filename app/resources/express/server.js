
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

console.log('');
console.log('EX.starting', __dirname);

// https://gist.github.com/maximilian-lindsey/a446a7ee87838a62099d
// app.set('views', __dirname + '/client/views');
// app.use(express.static(__dirname + '/client/dist/static'));

let port = 0;
const ip  = '127.0.0.1';
const datapath = path.join(__dirname, 'data');

class App {

  constructor() {

    this.express = express();
    this.router  = express.Router();
    this.middleware();
    this.errorHandlerMdw();

    this.loadData();
    this.activate()

  }

  loadData () {
    const initServers = JSON.parse(fs.readFileSync(path.join(datapath, 'init-servers.json'), 'utf8'));
    console.log('EX.loaded', initServers.length, 'servers');

    let db = new sqlite3.Database(path.join(datapath, 'observations.sqlite'), sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        console.error('EX.DB.error', err.message);
      } else {
        console.log('EX.DB.connected');
      }
    });

    const sql = `
      SELECT domain FROM domains LIMIT 3;
    `;
    db.each(sql, (err, row) => {
      if (err) {
        console.error(err.message);
      }
      console.log(row.domain);
    });

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
