"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const electron_log_1 = __importDefault(require("electron-log"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_router_1 = __importDefault(require("./api-router"));
dotenv_1.default.config();
Object.assign(console, electron_log_1.default.functions);
electron_log_1.default.transports.file.level = 'silly';
const preConfig = {
    api: {
        port: 0,
        ip: '127.0.0.1',
        protocol: 'http',
        root: '',
        family: ''
    },
    pathData: path_1.default.join(__dirname, 'data'),
    fileServers: path_1.default.join(__dirname, 'data', 'init-servers.json'),
    fileDB: '',
};
let config;
// let port = 0, apppath, isdev, dbfile;
// const ip  = '127.0.0.1';
// const datapath = path.join(__dirname, 'data');
// const dbfile   = path.join(datapath, 'observations.sqlite');
// const serverfile  = path.join(datapath, 'init-servers.json');
// const express     = require('express');
// const bodyParser  = require('body-parser');
// const cors        = require('cors')
// const log         = require('electron-log')
// const fs          = require('fs');
// const path        = require('path');
// const sqlite3     = require('sqlite3').verbose();
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.router = express_1.default.Router();
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        this.app.use((err, req, res, next) => {
            const { start, httpStatus, message, previousError, stack } = err;
            res.status(httpStatus || 406).json({
                status: false,
                code: httpStatus || 406,
                message,
                data: previousError
            });
        });
        // this.middleware();
        // this.errorHandlerMdw();
        // wait for first message
        process.on('message', (msg) => {
            console.log('EX.process.message', msg);
            if (msg.topic === 'config') {
                config = msg.payload;
                preConfig.fileDB = config.isDev
                    ? path_1.default.join(config.pathApp, 'app', 'resources', 'express', 'data', 'observations.sqlite')
                    : path_1.default.join(config.pathApp, '', 'resources', 'app.asar.unpacked', 'express', 'data', 'observations.sqlite');
                this.activate().then((adr) => {
                    preConfig.api.port = adr.port;
                    preConfig.api.ip = adr.address;
                    preConfig.api.family = adr.family;
                    config = Object.assign(config, preConfig);
                    // this.bus = new Bus('express', 'process', process);
                    console.log('config', config);
                    console.log('-------------------------');
                    // this.bus.emit({
                    //   topic: 'config',
                    //   receiver: 'electron',
                    //   payload: config,
                    // });
                    // this.bus.on('config', (msg) => {
                    //   const cfg = msg.config;
                    // });
                });
            }
        });
    }
    loadData() {
        const cfg = config;
        try {
            console.log('EX.JSON.trying...', cfg.fileServers);
            const initServers = JSON.parse(fs_1.default.readFileSync(cfg.fileServers, 'utf8'));
            console.log('EX.JSON.success', initServers.length, 'servers');
            console.log('TEST', path_1.default.resolve(String(process.resourcesPath), 'app/resources/express/data/database.db3'));
            console.log('EX.DB.trying...', cfg.fileDB);
            let db = new sqlite3_1.default.Database(cfg.fileDB, sqlite3_1.default.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error('EX.DB.error', err.message);
                }
                else {
                    console.log('EX.DB.success');
                }
            });
            db.each('SELECT domain FROM domains LIMIT 3;', (err, row) => {
                err && console.error(err.message);
                console.log(row.domain);
            });
        }
        catch (err) {
            console.error('EX.DB.loadData.error', err);
        }
    }
    activate() {
        return new Promise((resolve, reject) => {
            const cfg = config;
            process.on('message', (msg) => {
                console.log('EX.message', msg);
            });
            // most basic end point
            this.app.use(this.router.get('/', (req, res) => {
                res.json({ express: `API works on ${cfg.api.ip}:${cfg.api.port}` });
            }));
            // exposed API
            this.app.use('/api', api_router_1.default);
            // start listening
            const server = this.app.listen(preConfig.api.port, preConfig.api.ip, () => {
                const adr = server.address();
                console.log(`EX.listening on`, adr.address, adr.port);
                // process.send({ port });
                resolve(adr);
            });
            var route, routes = [];
            this.app._router.stack.forEach(function (middleware) {
                if (middleware.route) { // routes registered directly on the app
                    routes.push(middleware.route);
                }
                else if (middleware.name === 'router') { // router middleware
                    middleware.handle.stack.forEach(function (handler) {
                        route = handler.route;
                        route && routes.push(route);
                    });
                }
            });
            console.log('EX.activated', routes.map(r => ({ p: r.path, m: r.methods })));
        });
    }
    middleware() {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: false }));
        // const dbCon = require('./setup/db');
        // this.express.locals = { ...this.express.locals, db: dbCon() };
        // this.express.locals.db.sequelize.sync();
    }
    errorHandlerMdw() {
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
exports.default = new App();
//# sourceMappingURL=server.js.map