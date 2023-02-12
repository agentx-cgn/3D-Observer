
const express     = require('express');
const bodyParser  = require('body-parser');
const cors        = require('cors')
require('dotenv').config();

// console.log('Express starting ...', __dirname, __filename, process.env)

// https://gist.github.com/maximilian-lindsey/a446a7ee87838a62099d
// app.set('views', __dirname + '/client/views');
// app.use(express.static(__dirname + '/client/dist/static'));

const port = 3000;

console.log('\n######################')

class App {

  constructor() {

    this.express = express();
    this.middleware();
    this.routes();
    this.errorHandlerMdw();

    this.express.listen(port, () =>
      console.log('EX.listening on port 3000!')
    )

    process.on('message', (msg) => {
      console.log('Message from parent:', msg);
    });

  }

  middleware () {
    this.express.use(cors());
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    const dbCon = require('./setup/db');
    this.express.locals = { ...this.express.locals, db: dbCon() };
    this.express.locals.db.sequelize.sync();
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
      res.send({ express: 'Server: OK' });
    });

    this.express.use('/', router);

  }

}

// exports.default = new App().express;
exports.default = new App();

console.log('\n######################')
