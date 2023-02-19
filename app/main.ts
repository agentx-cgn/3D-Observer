import { app, BrowserWindow, screen, Menu, MenuItem, MessageChannelMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Bus from './bus';
import { IConfig, IMessage, TPayload } from './interfaces';
import { ChildProcess } from 'node:child_process';
import config from './config';
const { fork } = require("child_process");

// https://github.com/mslipper/electron-child-process-playground/tree/master/src

// LOGGING
const log  = require('electron-log');
Object.assign(console, log.functions);
log.transports.file.level = 'silly';

let
  win: BrowserWindow = null,
  busExp: Bus = null,
  busWin: Bus = null,
  childController = new AbortController()
;

// https://www.appsloveworld.com/bestanswer/sqlite/53/cannot-find-sqlite-file-in-production-mode-electron-angular

console.log('#')
console.log('#')
console.log('#')
console.log('#')
console.log('#')
console.log('## # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # ')
console.log('EC.starting...', config);

// (event: Electron.Event, launchInfo: Record<string, any> | Electron.NotificationResponse)

// waiting for app.ready
const promise = launchApp()

// now waiting for config w/ port from express
  .then( ([event, launchInfo]) => {
    return launchExpress();
  })

  // now waiting for window
  .then( payload => {

    console.log('EC.api', payload.api);

    // update config w/ api
    Object.assign(config, payload);

    // if (process.platform === 'darwin') {
    //   setApplicationMenu();
    // }

    return launchBrowser();

  })

  // waiting for comm established
  .then(win => {
    return createBrowserChannel(win);
  })

  // setup some minor events
  // .then( response => {
  //   return activateWindow();
  // })

  // wait for finish // did-finish-load
  .then( response => {

    // console.log('EX.Browser.reponse', response);

    console.log('EC.loading.done', response);
    console.log('####################################');
    console.log('#')
    console.log('#')
    console.log('#')
    console.log('#')
    console.log('#')

  })

  // TODO proper catch

;


function launchExpress(): Promise<IConfig> {

  console.log()

  const { signal } = childController;

  return new Promise<IConfig>(function(resolve, reject) {

    const child: ChildProcess = fork(config.fileExpress, ['child'], { signal });

    busExp = new Bus('electron', 'process', child);

    // expect initial config w/ port back from express
    busExp.on('config', (msg: IMessage<IConfig>) => {
      resolve(msg.payload);
    });

    // send initial config
    busExp.emit({
      topic:    'config',
      receiver: 'express',
      payload:   config
    });

    child.on('error', (err) => {
      console.log('EC.child.onError', Object.keys(err));
      reject(err);
    });

    child.on('close', (code) => console.log('EC.child.onClose', code));

  });

  // // child.send({ apppath: app.getAppPath(), isdev: serve });

  // probably Abort Error
  // child.on('message', (data) => {
  //   console.log('EC.child.onMessage', data)
  //   resolve(data);
  // });

  // console.log('EC.trying', urlexpress);
  // http.get(urlexpress, res => {

  //   console.log('EC.trying.status', res.statusCode, res.statusMessage);
  //   // console.log('EC.response',res.statusCode, res.statusMessage, Object.keys(res), res.rawHeaders);

  //   let data = [];

  //   res.on('data', chunk => {
  //     data.push(chunk);
  //   });

  //   res.on('end', () => {
  //     const text = JSON.parse(Buffer.concat(data).toString());
  //     console.log('EC.trying.end', text, data);
  //   });

  // }).on('error', err => {
  //   console.warn('EC.error.trying', err.message);
  // });

}

function activateWindow() {

  return new Promise( (resolve, reject) => {

    // https://www.electronjs.org/docs/latest/api/web-contents

    // Show DevTools, still always
    config.isDev && win.webContents.openDevTools();

    win.webContents.on('devtools-opened', () => {
      win.focus();
      setImmediate(() => win.focus());
    });

    // win.webContents.on('console-message', (...args) => {

    //   let msg = args[2];

    //   msg = (
    //     msg.includes('allowRunningInsecureContent')      ? '' :
    //     msg.includes('Insecure Content-Security-Policy') ? '' :
    //     msg.trim().slice(0, 40)
    //   );

    //   // console.log('WIN', args[2].slice(0, 40));

    // });

    // Emitted when the window is closed.
    win.on('closed', () => {

      // Dereference the window object, usually you would store window
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = null;

    });

    resolve(true);

  });

}

function loadIndexHtml (win:BrowserWindow) {

  let href = '';

  if (config.serve) {
    const debug = require('electron-debug');
    debug();
    require('electron-reloader')(module);
    href = 'https://localhost:4200';

  } else {

    // Path when running electron executable
    let pathIndex = './index.html';

    // Path when running electron in local folder
    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    href = url.href

  }

  console.log('EC.loadIndexHtml', href);
  win.loadURL(href);


}

function launchBrowser(): Promise<BrowserWindow> {

  return new Promise( (resolve, reject) => {

    const { workAreaSize, rotation, scaleFactor } = screen.getPrimaryDisplay();

    config.screen = { workAreaSize, rotation, scaleFactor };

    // Create the browser window.
    win = new BrowserWindow({
      x: 32,
      y: 32,
      width:  ~~(workAreaSize.width * 0.9),
      height: ~~(workAreaSize.height * 0.7),
      webPreferences: {
        devTools: true,
        nodeIntegration: true,
        // allowRunningInsecureContent: (serve),
        allowRunningInsecureContent: true,
        contextIsolation: false,  // false if you want to run e2e test with Spectron
        preload: path.join(__dirname, config.filePreload),
      },
    });

    win.webContents.on('did-finish-load', () => {
      console.log('EC.webContents', 'did-finish-load');
      resolve(win);
    });

    activateWindow();

    loadIndexHtml(win);

  });

}

function setApplicationMenu() {

  // if (process.platform !== 'darwin') {
  //   return;
  // }

  // hide Help menu
  const menu = Menu.getApplicationMenu();
  let viewMenu: MenuItem | undefined;

  menu?.items.forEach(item => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (item.role === 'help') {
      item.visible = false;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (item.role === 'viewmenu') {
      viewMenu = item;
    }
  });

  // hide Reload and Force Reload menu items
  viewMenu?.submenu?.items.forEach(item => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (item.role === 'reload' || item.role === 'forcereload') {
      item.visible = false;
      item.enabled = false;
    }
  });

  // console.log('EC.Menu', menu);
  // Menu.setApplicationMenu(menu);

}

function createBrowserChannel(win: BrowserWindow) {

  return new Promise( (resolve) => {

    // We'll be sending one end of this channel to the main world of the context-isolated page.
    const { port1, port2 } = new MessageChannelMain()

    busWin = new Bus('electron', 'mainport', port2);

    // We can also receive messages from the main world of the renderer.
    // wait for browser bus ready
    busWin.on('ack', (msg) => {
      // console.log('EC.createBrowserChannel.ack', msg);
      resolve(msg);
    });

    // It's OK to send a message on the channel before the other end has
    // registered a listener. Messages will be queued until a listener is registered.
    busWin.emit({
      topic: 'config',
      receiver: 'browser',
      payload: config,
    });

    // init handshake
    win.webContents.postMessage('main-world-port', null, [port1]);

  });

}

function launchApp () {

  return new Promise( (resolve, reject) => {

    try {

      // TODO: disable in PROD
      app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

      app.setAboutPanelOptions({
        applicationName: 'Fediverse Explorer',
        applicationVersion: app.getVersion(),
        version: app.getVersion(),
        website: 'https://github.com',
        copyright: `© 2022-${config.thisYear} vion11@gmail.com`
      });

      // This method will be called when Electron has finished
      // initialization and is ready to create browser windows.
      // Some APIs can only be used after this event occurs.
      app.on('ready', async (event: Electron.Event, launchInfo: Record<string, any> | Electron.NotificationResponse) => {
        resolve([event, launchInfo]);
      });

      // Quit when all windows are closed.
      app.on('window-all-closed', () => {

        // Stops the child/express process
        childController.abort();

        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
          app.quit();
        }

      });

      app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
          launchBrowser();
        }
      });

    } catch (err) {
      reject(err)
    }

  });

}


// const { exec } = require('child_process')

// function run(cmd, options) {
//   return new Promise((resolve, reject) => {
//     exec(cmd, options, (error, stdout, stderr) => {
//       if (error) return reject(error)
//       if (stderr) return reject(stderr)
//       resolve(stdout)
//     })
//   })
// }

// // usage example
// ;(async () => {
//   const result = await run('echo "hello"', { maxBuffer: 1024 * 1024 * 2 })
//   console.log(result) // hello
// })()
