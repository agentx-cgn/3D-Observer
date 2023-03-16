import { app, BrowserWindow, screen, Menu, MenuItem, MessageChannelMain } from 'electron'
import { ChildProcess, ForkOptions } from 'node:child_process'
import { fork } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as log from 'electron-log'

import { IConfig, IMessage, TPayload } from './interfaces'
import Bus from './bus'
import config from './config'

// https://github.com/mslipper/electron-child-process-playground/tree/master/src

// LOGGING
Object.assign(console, log.functions)
log.transports.file.level = 'silly'

let
  win: BrowserWindow = null,
  busExp: Bus = null,
  busWin: Bus = null,
  childController = new AbortController()
;


console.log('#')
console.log('#')
console.log('#')
console.log('#')
console.log('#')
console.log('## # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # ')

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
  console.log('Main.ExitHandler', options, exitCode);
  if (options.cleanup) console.log('clean');
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));



console.log('ELC.starting...', config);

// SETUP: copy DB, if not exists in user path
// '/Users/noiv/Library/Application Support/3D-Observer/observations.sqlite'
if (config.existsFileDBSource && !config.existsFileDBTarget) {
  fs.copyFileSync(config.fileDBSource, config.fileDBTarget, fs.constants.COPYFILE_EXCL)
  console.log('ECL.coppied.DB', config.fileDBTarget)
} else {
  console.log('ECL.DB.exists', config.fileDBTarget)
}

// waiting for app.ready
const promise = launchApp()

  // now waiting for config w/ port from express
  .then( ([event, launchInfo]) => {
    return launchExpress();
  })

  // now waiting for window
  .then( payload => {

    console.log('ELC.api.root', payload.api.root);

    // update config w/ api
    Object.assign(config, payload);

    if (process.platform === 'darwin') {
      // setApplicationMenu();
    }

    return launchBrowser()

  })

  // wait for finish // did-finish-load
  .then( msg => {

    console.log('ELC.loading.done', msg.topic, msg.sender);
    console.log('####################################');
    console.log('#')
    console.log('#')
    console.log('#')
    console.log('#')
    console.log('#')

  })

  .catch( err => {

    console.log('ELC.catch', err)
    process.exitCode = 1

  })

;


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

function launchExpress(): Promise<IConfig> {

  console.log()

  // const { signal } = childController;

  return new Promise<IConfig>(function(resolve, reject) {

    const controller = new AbortController()
    const { signal } = controller
    const child: ChildProcess = fork(config.fileExpress, ['child'], { signal } as ForkOptions)

    busExp = new Bus('electron', 'express', child)

    // expect initial config w/ port back from express
    busExp.on('config', (msg: IMessage<IConfig>) => {
      resolve(msg.payload);
    });

    // send initial config
    busExp.send('config', 'express', config)

    child.on('error', (err) => {
      console.log('ELC.child.onError', Object.keys(err));
      reject(err);
    })

    child.on('close', (code) => {
      console.log('ELC.child.onClose', code)
    });

    child.on('beforeExit', code => {
      console.log('ELC.child.onBeforeExit', code)
      // Can make asynchronous calls
      setTimeout(() => {
        console.log(`Process will exit with code: ${code}`)
        // child.exit(code)
        // controller.abort();
      }, 100)
    })

    child.on('exit', code => {
      // Only synchronous calls
      console.log('ELC.child.exit', code);
    })


  });

}

function setApplicationMenu() {

  if (process.platform !== 'darwin') return

  // hide Help menu
  const menu = Menu.getApplicationMenu();
  let viewMenu: MenuItem | undefined;

  menu?.items.forEach(item => {

    if (item.role === 'help') {
      item.visible = false;
    }

    if (item.role === 'viewMenu') {
      viewMenu = item;
    }
  });

  // hide Reload and Force Reload menu items
  viewMenu?.submenu?.items.forEach(item => {
    if (item.role === 'reload' || item.role === 'forceReload') {
      item.visible = false;
      item.enabled = false;
    }
  });

  // console.log('ELC.Menu', menu);
  // Menu.setApplicationMenu(menu);

}


function launchBrowser(): Promise<IMessage<TPayload>> {

  return new Promise( (resolve, reject) => {

    const { workAreaSize, rotation, scaleFactor } = screen.getPrimaryDisplay()

    config.screen = { workAreaSize, rotation, scaleFactor }

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
      }
    })

    win.webContents.on('did-finish-load', () => {
      console.log('ELC.webContents', 'did-finish-load');
      createBrowserChannel(win)
        .then(ack => {
          Bus.connect(busExp, busWin)
          resolve(ack);
        })
      ;
    })

    win.webContents.on('ipc-message', (data) => {
      console.log('ELC.webContents', 'ipc-message', data);
    })

    // Show DevTools, still always
    config.isDev && win.webContents.openDevTools();

    win.webContents.on('devtools-opened', () => {
      win.focus();
      setImmediate(() => win.focus());
    })

    // Emitted when the window is closed.
    win.on('closed', () => {

      // Dereference the window object, usually you would store window
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = null;

    })

    loadIndexHtml(win)

  })

}

function createBrowserChannel(win: BrowserWindow): Promise<IMessage<TPayload>> {

  return new Promise<IMessage<TPayload>>((resolve) => {

    // We'll be sending one end of this channel to the main world of the context-isolated page.
    const { port1, port2 } = new MessageChannelMain()

    // always create a new bus, when browser loads or reloads
    busWin = new Bus('electron', 'browser', port2);

    // We can also receive messages from the main world of the renderer.
    // wait for browser bus ready
    busWin.on('ack', (msg: IMessage<TPayload>) => {
      console.log('ELC.createBrowserChannel.ack', msg);
      resolve(msg);
    });

    // It's OK to send a message on the channel before the other end has
    // registered a listener. Messages will be queued until a listener is registered.
    busWin.emit({
      topic:    'config',
      receiver: 'browser',
      payload:   config,
    });

    // init handshake
    win.webContents.postMessage('main-world-port', null, [port1]);

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

  console.log('ELC.loadIndexHtml', href);
  win.loadURL(href);


}
