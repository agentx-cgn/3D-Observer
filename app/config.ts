
import { IConfig } from "./interfaces"
import { app } from 'electron';
import path from 'path'
import fs from 'fs'

const args     = process.argv.slice(1)
const isDev    = args.some(val => val === '--serve')
const pathApp  = app.getAppPath()
const pathUser = app.getPath('userData')

const fileDBTarget = path.join(pathUser, 'observations.sqlite')
const fileDBSource = isDev
  ? path.join(pathApp, 'app', 'resources', 'express', 'data', 'observations.sqlite')
  : path.join(pathApp, '', 'resources', 'app.asar.unpacked', 'express', 'data', 'observations.sqlite')

const existsFileDBTarget = fs.existsSync(fileDBTarget)
const existsFileDBSource = fs.existsSync(fileDBSource)

const config: IConfig = {

  version: app.getVersion(),

  args,
  serve: args.some(val => val === '--serve'),

  isDev,
  isPacked:      app.isPackaged,
  isDevelopment: process.env.NODE_ENV !== 'production',
  isAsar:        require.main.filename.indexOf('app.asar') === -1,

  userLanguages: app.getPreferredSystemLanguages(),

  thisYear:      new Date().getFullYear(),

  screen: { workAreaSize: { width: NaN, height: NaN }, rotation: NaN, scaleFactor: NaN },

  existsFileDBTarget,
  existsFileDBSource,

  fileDBTarget,
  fileDBSource,
  filePreload:  'preload.js',
  fileExpress:  path.join(__dirname, 'resources', 'express', 'server'),
  fileServers:  path.join(__dirname, 'resources', 'express', 'server', 'data', 'init-servers.json'),

  // /Users/noiv/Library/Logs/3D-Observer/main.log
  // fileLog: log.transports.file.resolvePathFn = () => path.join(APP_DATA, 'logs/main.log');

  api: {
    port: 0,
    ip: '127.0.0.1',
    protocol: 'http',
    root: '',
    family: ''
  },

  pathApp,
  pathData:      path.join(__dirname, 'resources', 'express', 'server', 'data', 'init-servers.json'),
  pathResources: process.resourcesPath,
  pathUser:      app.getPath('userData')

}

export default config;
