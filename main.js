// Holden Ernest - 1/11/2024
// This will load the page into a window

const { app, BrowserWindow, ipcMain} = require('electron');
const path = require('node:path');

const fs = require("fs");
const csv = require('jquery-csv');
const JSONdb = require('simple-json-db');
const db = new JSONdb('./preferences.json');
var mainWindow;

const createWindow = (fileName) => { // function to make the window
    const win = new BrowserWindow({
        autoHideMenuBar: true,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    win.loadFile(`${fileName}.html`)
    mainWindow = win;
}



ipcMain.on('attempt-login', (event, loginInfo) => { // open specified page
    if (correctLoginCreds(loginInfo.user, loginInfo.pass)) {
        mainWindow.close();
        createWindow('index');
    }
});
const correctLoginCreds = (username, password) => {
    console.log(`attempting to log in: [user:${username}, pass:${password}]`);
    // TODO: MAKE SURE THE LOCAL USERNAME AND PASSWORD YIELD A REAL ACCOUNT FOUND ON THE SERVER
    if (password == 'Th3Pass' && username == '12345') {
        db.set('uuid', username);
        db.set('password', password);
        return true;
    }
    return false;
}
const isSignedIn = () => {
    let username = db.get('uuid');
    let password = db.get('password');
    return correctLoginCreds(username, password);
}

// EVENT - load the list 
ipcMain.on('load-list', (event, fileName) => {
    displayList(fileName);
});
ipcMain.on('load-last-list', (event) => {
    displayList(db.get("lastList") + ".csv");
});
function displayList(fileName) {
    fs.readFile(path.join(__dirname, fileName), 'utf8', function (err, data) {
        if (err) return console.error(err);
        // data is the contents of the text file we just read
        var listArray = parseToArray(data);
        // display them to the page
        mainWindow.webContents.send("display-list", listArray);
    });
}

function parseToArray(stringVal) {
    const [keys, ...rest] = stringVal
      .trim()
      .split("\n")
      .map((item) => item.split(','));
    const formedArr = rest.map((item) => {
      const object = {};
      keys.forEach((key, index) => (object[key] = item.at(index)));
      return object;
    });
    return formedArr;
}

app.whenReady().then(() => { // Start the application
    if (isSignedIn())
        createWindow('index'); // if the user is signed in(locally), have them go to the home page, otherwise re-login
    else createWindow('login');
    app.on('activate', () => { // allow event listener after the window is created
        if (BrowserWindow.getAllWindows().length === 0) {
            if (isSignedIn())
                createWindow('index');
            else createWindow('login');
        }
    })
})

app.on('window-all-closed', () => { // CLOSE THE APP
    if (process.platform !== 'darwin') app.quit();
})