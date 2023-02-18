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
// let port: number;

// const
//   args = process.argv.slice(1),
//   serve = args.some(val => val === '--serve'),
//   childController = new AbortController(),
//   isDevelopment = process.env.NODE_ENV !== 'production',
//   thisYear = new Date().getFullYear(),
//   isAsar = require.main.filename.indexOf('app.asar') === -1,
//   expressfile = `${__dirname}/resources/express/server`
// ;

// https://www.appsloveworld.com/bestanswer/sqlite/53/cannot-find-sqlite-file-in-production-mode-electron-angular

  console.log()
  console.log('## # # # # # # # # # # ')
  console.log('EC.starting...', config);

  launchApp();



  // log.transports.file.resolvePathFn = () => path.join(APP_DATA, 'logs/main.log');
  // log.transports.file.resolvePathFn = () => __dirname + "/3D-Observer.main.log";

  // (async () => {
  //   port = await getPort({port: 3000});

  // })();



async function launchServer(): Promise<any> {

  console.log()

  const { signal } = childController;

  return new Promise<any>(function(resolve, reject) {

    const child: ChildProcess = fork(config.fileExpress, ['child'], { signal });

    busExp = new Bus('electron', 'process', child);

    busExp.on('port', (msg: IMessage<TPayload>) => {
      if (msg.sender === 'express') {
        resolve(msg.payload);
      }
    });

    busExp.emit({
      topic:    'config',
      receiver: 'express',
      payload: config
    });

    // bus.on('port', (msg: IMessage<TPayload>) => {
    //   if (msg.sender === 'express') {
    //     resolve(msg.payload)
    //   }
    // })


    // // child.send({ apppath: app.getAppPath(), isdev: serve });

    // probably Abort Error
    child.on('message', (data) => {
      console.log('EC.child.onMessage', data)
      resolve(data);
    });

    child.on('error', (err) => {
      console.log('EC.child.onError', Object.keys(err));
      reject(err);
    });

    child.on('close', (code) => console.log('EC.onClose', code));

  });


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

  // https://www.electronjs.org/docs/latest/api/web-contents

  // Show DevTools, still always
  config.isDev && win.webContents.openDevTools();
  win.webContents.on('devtools-opened', () => {
    win.focus();
    setImmediate(() => win.focus());
  });

  win.webContents.on('console-message', (...args) => {

    let msg = args[2];

    msg = (
      msg.includes('allowRunningInsecureContent')      ? '' :
      msg.includes('Insecure Content-Security-Policy') ? '' :
      msg.trim().slice(0, 40)
    );

    // msg && console.log('WIN', args[2].split('›').slice(-1)[0])
    // console.log('WIN', args[2].slice(0, 40));

  });

  win.webContents.on('did-finish-load', () => {
    console.log('EC.webContents', 'did-finish-load');
    // win.webContents.send('ping', 'whoooooooh!')
  })

}

function createWindow(size): BrowserWindow {

  // Create the browser window.
  win = new BrowserWindow({
    x: 32,
    y: 32,
    width: ~~(size.width * 0.9),
    height: ~~(size.height * 0.7),
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      // allowRunningInsecureContent: (serve),
      allowRunningInsecureContent: true,
      contextIsolation: false,  // false if you want to run e2e test with Spectron
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // start listening
  activateWindow();

  if (config.serve) {
    const debug = require('electron-debug');
    debug();
    require('electron-reloader')(module);
    win.loadURL('https://localhost:4200');

  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    // Path when running electron in local folder
    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);

  }



  // Emitted when the window is closed.
  win.on('closed', () => {

    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;

  });

  return win;

}

function setApplicationMenu() {

  if (process.platform !== 'darwin') {
    return;
  }

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

function createChannel(config) {

  // We'll be sending one end of this channel to the main world of the
  // context-isolated page.
  const { port1, port2 } = new MessageChannelMain()

  // It's OK to send a message on the channel before the other end has
  // registered a listener. Messages will be queued until a listener is
  // registered.
  port2.postMessage({ ping: 21 })
  port2.postMessage({ config })

  // We can also receive messages from the main world of the renderer.
  port2.on('message', (event) => {
    console.log('EC.Browser.message', event.data)
  })
  port2.start()

  return port1;


}

function launchApp () {

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
    // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    // app.on('ready', () => setTimeout(createWindow, 400));
    app.on('ready', async () => {

      // { width: 2560, height: 1415 }
      const { workAreaSize, rotation, scaleFactor } = screen.getPrimaryDisplay();

      console.log('')
      console.log('EC.screen', { size: workAreaSize, rotation, scaleFactor })

      setApplicationMenu();
      const response  = await launchServer();
      const port1 = createChannel(response);

      createWindow(workAreaSize);

      // The preload script will receive this IPC message and transfer the port
      // over to the main world.
      win.webContents.postMessage('main-world-port', null, [port1])

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
        const size = screen.getPrimaryDisplay().workAreaSize;
        createWindow(size);
      }
    });

  } catch (e) {
    // Catch Error
    // throw e;
  }

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
