
import { IConfig } from "./interfaces"
import { app } from 'electron';
// import package_json from '../package.json'

const config: IConfig = {

  version: app.getVersion(),

  args: process.argv.slice(1),
  serve: process.argv.slice(1).some(val => val === '--serve'),

  isDevelopment: process.env.NODE_ENV !== 'production',
  isAsar: require.main.filename.indexOf('app.asar') === -1,
  isDev: process.argv.slice(1).some(val => val === '--serve'),
  isPacked: app.isPackaged,

  userLanguages: app.getPreferredSystemLanguages(),

  thisYear: new Date().getFullYear(),

  filePreload: 'preload.js',
  fileServers: '',
  fileExpress: `${__dirname}/resources/express/server`,

  pathResources: process.resourcesPath,
  pathApp: app.getAppPath(),
  pathData: '',
  pathUser: app.getPath('userData')

}

export default config;
