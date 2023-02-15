
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors')
const log         = require('electron-log')

require('dotenv').config();
Object.assign(console, log.functions);
log.transports.file.level = 'silly';

console.log('');
console.log('EX.starting', __dirname);

// https://gist.github.com/maximilian-lindsey/a446a7ee87838a62099d
// app.set('views', __dirname + '/client/views');
// app.use(express.static(__dirname + '/client/dist/static'));

let port;
const ip  = '127.0.0.1';

class App {

  constructor() {

    this.express = express();
    this.middleware();
    this.routes();
    this.errorHandlerMdw();

    const server = this.express.listen(0, ip, () => {
      port = server.address().port;
      console.log(`EX.listening on ${ip}:${port}`);
      process.send({ port });
    });

    process.on('message', (msg) => {
      console.log('EX.message', msg);
    });

  }

  middleware () {
    this.express.use(cors());
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    // const dbCon = require('./setup/db');
    // this.express.locals = { ...this.express.locals, db: dbCon() };
    // this.express.locals.db.sequelize.sync();
    require('./initRoutes')(this.express);
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

  async routes () {

    let router = express.Router();

    router.get('/', (req, res, next) => {
      res.send({ express: `API works on ${ip}:${port}` });
    });

    this.express.use('/', router);

  }

}

// exports.default = new App().express;
exports.default = new App();
