import { app, BrowserWindow, screen, Menu, MenuItem } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const http = require('http');

const { fork } = require("child_process");

let win: BrowserWindow = null;

const
  args = process.argv.slice(1),
  serve = args.some(val => val === '--serve'),
  childController = new AbortController(),
  port = 3000,
  urlexpress = `http://localhost:${port}/`,
  isDevelopment = process.env.NODE_ENV !== 'production',
  thisYear = new Date().getFullYear(),
  isAsar = require.main.filename.indexOf('app.asar') === -1,
  expressfile = isAsar
    ? `${__dirname}/resources/express/server`
    : `${process.resourcesPath}/resources/express/server`

;

function createServer() {

  console.log()

  const { signal } = childController;

  const child = fork(expressfile, ['child'], { signal });

  // probably Abort Error
  child.on('error',   (err)  => console.log('EC.onError', Object.keys(err)));
  child.on('message', (data) => console.log('EC.onMessage', Object.keys(data)));
  child.on('close',   (code) => console.log('EX.onClose', code));

  console.log('\nEC.trying', urlexpress);
  http.get(urlexpress, res => {

    console.log('\nEC.trying.status', res.statusCode, res.statusMessage);
    // console.log('\nEC.response',res.statusCode, res.statusMessage, Object.keys(res), res.rawHeaders);

    let data = [];

    res.on('data', chunk => {
      data.push(chunk);
    });

    res.on('end', () => {
      const text = JSON.parse(Buffer.concat(data).toString());
      console.log('\nEC.trying.end', text);
    });

  }).on('error', err => {
    console.log('\nEC.error.trying', err.message);
  });

}

function createWindow(size): BrowserWindow {

  // console.log('EC.screen.size', size) { width: 2560, height: 1415 }
  console.log('process.resourcesPath', process.resourcesPath);


  // Create the browser window.
  win = new BrowserWindow({
    x: 32,
    y: 32,
    width:  ~~(size.width  * 0.9),
    height: ~~(size.height * 0.7),
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,  // false if you want to run e2e test with Spectron
    },
  });

  // Show DevTools
  isDevelopment && win.webContents.openDevTools();
  win.webContents.on('devtools-opened', () => {
    win.focus()
    setImmediate(() => {
      win.focus()
    })
  })

  if (serve) {
    const debug = require('electron-debug');
    debug();
    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');

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
  console.log('EC.Menu', menu);
  // Menu.setApplicationMenu(menu);
}
try {

  app.setAboutPanelOptions({
    applicationName: 'Fediverse Explorer',
    applicationVersion: app.getVersion(),
    version: app.getVersion(),
    website: 'https://github.com',
    copyright: `© 2022-${thisYear} vion11@gmail.com`
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  // app.on('ready', () => setTimeout(createWindow, 400));
  app.on('ready', () => {
    const size = screen.getPrimaryDisplay().workAreaSize;
    setApplicationMenu();
    createServer();
    createWindow(size);
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
