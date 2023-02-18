
import { IConfig } from "./interfaces"
import { app } from 'electron';

const config: IConfig = {

  args: process.argv.slice(1),
  serve: process.argv.slice(1).some(val => val === '--serve'),

  isDevelopment: process.env.NODE_ENV !== 'production',
  isAsar: require.main.filename.indexOf('app.asar') === -1,
  isDev: process.argv.slice(1).some(val => val === '--serve'),
  isPacked: app.isPackaged,

  thisYear: new Date().getFullYear(),

  fileServers: '',
  fileExpress: `${__dirname}/resources/express/server`,
  pathResources: process.resourcesPath,
  pathApp: app.getAppPath(),
  pathData: '',

}

export default config;
