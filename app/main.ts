import { app, BrowserWindow, screen } from 'electron';
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
  isDevelopment = process.env.NODE_ENV !== 'production'

;

function createServer() {

  // determine resources folder
  // https://stackoverflow.com/questions/45392642/how-to-add-folders-and-files-to-electron-build-using-electron-builder/48339186#48339186
  // process.resourcesPath /Users/tbecker/Projects/3D-Observer/node_modules/electron/dist/Electron.app/Contents/Resources

  const { signal } = childController;
  const expressfile = `${__dirname}/resources/express/server`;

  // https://www.freecodecamp.org/news/node-js-child-processes-everything-you-need-to-know-e69498fe970a/#the-fork-function
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

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  // app.on('ready', () => setTimeout(createWindow, 400));
  app.on('ready', () => {
    const size = screen.getPrimaryDisplay().workAreaSize;
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
