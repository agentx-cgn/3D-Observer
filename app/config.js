"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const config = {
    args: process.argv.slice(1),
    serve: process.argv.slice(1).some(val => val === '--serve'),
    isDevelopment: process.env.NODE_ENV !== 'production',
    isAsar: require.main.filename.indexOf('app.asar') === -1,
    isDev: process.argv.slice(1).some(val => val === '--serve'),
    isPacked: electron_1.app.isPackaged,
    thisYear: new Date().getFullYear(),
    fileServers: '',
    fileExpress: `${__dirname}/resources/express/server`,
    pathResources: process.resourcesPath,
    pathApp: electron_1.app.getAppPath(),
    pathData: '',
};
exports.default = config;
//# sourceMappingURL=config.js.map