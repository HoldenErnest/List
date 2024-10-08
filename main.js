// Holden Ernest - 1/11/2024
// This will load the page into a window
// it also handles all of the background node processes, including actual interactions to the server

const { app, BrowserWindow, ipcMain} = require('electron');
if (require('electron-squirrel-startup')) app.quit();
const path = require('node:path');

const https = require('node:https');
const fs = require("fs");
const JSONdb = require('simple-json-db');
const db = new JSONdb(path.join(app.getPath("userData"), 'userPrefs.json'));
var mainWindow;

require('dotenv').config();
var imageSearch = require('image-search-google');
const { Console } = require('node:console');
var imgSearch = new imageSearch(process.env.CSE_ID, process.env.IMG_API_KEY);
const imgOptions = {page:1};

var currentListName; // keep track of the list youre currently displaying to renderer

const createWindow = (fileName) => { // function to make the window
    const win = new BrowserWindow({
        icon: path.join(__dirname, 'images/icon.png'),
        autoHideMenuBar: true,
        width: 800, // 800
        height: 600, // 600
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    })
    win.loadFile(`${fileName}.html`)
    //win.removeMenu()
    mainWindow = win;
}

app.whenReady().then(async () => { // Start the application
    if (await isSignedIn())
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



ipcMain.on('attempt-login', (event, loginInfo) => { // open specified page
    if (correctLoginCreds(loginInfo.user, loginInfo.pass)) {
        mainWindow.close();
        createWindow('index');
    }
});
const correctLoginCreds = async (username, password) => {
    console.log(`attempting to log in: [user:${username}, pass:${password}]`);
    // TODO: MAKE SURE THE LOCAL USERNAME AND PASSWORD YIELD A REAL ACCOUNT FOUND ON THE SERVER
    var goodLogin = await tryLoginToServer(username, password);
    if (goodLogin) {
        db.set('uuid', username); // reset the uuid since this is the latest known real login
        db.set('password', password);
        return true;
    }
    return false;
}
const isSignedIn = async () => {
    let username = db.get('uuid');
    let password = db.get('password');
    if (!username || !password) return false;
    return await correctLoginCreds(username, password);
}

// EVENT - load the list 
ipcMain.on('load-list', (event, fileName) => {
    displayList(fileName);
});
ipcMain.on('load-last-list', (event) => { // ran from preload
    displayList(db.get("lastList"));
});
ipcMain.on('update-avail-lists', (event) => { // ran from preload
    updateAvailableLists();
});
ipcMain.on('save-list', (event, csvString) => {
    console.log("saving list hopefully");
    saveList(csvString);
});
ipcMain.on('get-urls', (event, searched) => {
    console.log("searching for: " + searched);
    try {
        imgSearch.search(searched, imgOptions).then( images => {
            var urls = images.map(img => {
                return (img.url);
                
            });
            mainWindow.webContents.send("update-image", urls);
        });
        
    } catch (e){
        console.error("PROBLEM WITH LOADING THE IMAGE URLS: " + e);
    }
});
ipcMain.on('rename-list', (event, fileName) => {
    var fullPath = path.join(app.getPath("userData"), "clientLists");
    var oldPath = path.join(fullPath,currentListName) + ".csv";
    var newPath = path.join(fullPath,fileName) + ".csv";
    fs.rename(
        oldPath,
        newPath,
        (error) => {
            if (error) {
                // Show the error 
                console.log(error);
            }
            else {
                console.log("\nFile Renamed\n" + oldPath + " >> " + newPath);
                currentListName = fileName;
                updateAvailableLists();
            }
        });
    
});
// END EVENTS


function saveList(csvString) {
    var serverHasFile = false;
    var fileName = currentListName;

    var fullPath = "";
    if (!serverHasFile) {
        fullPath = path.join(app.getPath("userData"), "clientLists");
        if (!fs.existsSync(fullPath)){
            fs.mkdirSync(fullPath);
        }
    }
    fullPath = path.join(fullPath,fileName);
    fullPath += ".csv";
    
    csvString = "\"title\",\"notes\",\"rating\",\"tags\",\"date\",\"image\"\n" + csvString;
    fs.writeFile(fullPath, csvString, err => {
        if (err) {
          console.error(err);
        } else {
          console.log("Saved file: '" + fileName + "'!")
        }
    });
    trySaveListToServer(csvString);
}
async function displayList(fileName) {
    var serverHasFile = false; // TODO: request to server to see if it has a list, if not display client version list or show error
    fileName = fileName || "newList";
    currentListName = fileName;
    db.set("lastList",fileName);


    // Attempt to get from server first
    var serverData = await tryLoadList(fileName);
    
    if (serverData != "") {
        var listArray = parseToArray(serverData);
        mainWindow.webContents.send("display-list", listArray);
        return;
    }

    // read from a local file instead
    console.log("reading " + fileName + " locally");
    var fullPath = "";
    fullPath = path.join(app.getPath("userData"), "clientLists");
    if (!fs.existsSync(fullPath)){
        return;
    }
    fullPath = path.join(fullPath,fileName);
    fullPath += ".csv";

    console.log("Displaying list: '" + fileName + "'"); // TODO: FIX, if its not a real path, just errors
    fs.readFile(fullPath, 'utf8', function (err, data) {
        if (err) return console.error(err);
        // data is the contents of the text file we just read
        var listArray = parseToArray(data);
        // display them to the page
        mainWindow.webContents.send("display-list", listArray);
    });
}
function updateAvailableLists() {
    var serverHasFile = false; // TODO: request to server to see if it has a list, if not display client version list or show error

    var fullPath = "";
    if (!serverHasFile) {
        fullPath = path.join(app.getPath("userData"), "clientLists");
        if (!fs.existsSync(fullPath)){
            return;
        }
    }
    var files = fs.readdirSync(fullPath);
    files = files.map((name) => {
        if (name.length <= 4 || !name.endsWith('.csv')) return;
        return name.substring(0,name.length - 4);
    });
    files.filter(n => n); // remove all null elements
    //console.log(`Path: ${fullPath} contains: ${files}`);
    currentListName = currentListName || db.get("lastList");
    mainWindow.webContents.send("recieve-list-names", {allNames:files,selectedList:currentListName});
}

function parseToArray(stringVal) {
    const [keys, ...rest] = stringVal
      .trim()
      .split("\n")
      .map((item) => item.slice(1, -1).split("\",\"")); // remove the first and last "\"", then split
    const formedArr = rest.map((item) => {
      const object = {};
      keys.forEach((key, index) => (object[key] = item.at(index)));
      return object;
    });
    formedArr.forEach(item => {
        item.title = toTitleCase(item.title);
        item.notes = item.notes.replaceAll("\\n","\n");
        item.tags = item.tags.replaceAll(" ",", ");
    });
    return formedArr;
}
function toTitleCase(str) {
    return str[0].toUpperCase() + str.slice(1);
}

// SERVER CONNECTION STUFF---------------------------------
function getHttpsOptions(user, pass, mode, list, contentLen) {
    var httpsOptions = {
        hostname: '127.0.0.1',
        path: "/",
        rejectUnauthorized: false, // [WARNING] - this is only for localhost purposes (remove this to make sure the client accepts that the IP is what the CA says it is)
        port: 2001,
        method: 'lupu',
        headers: {
            'Content-Length': contentLen,
            'Content-Type': 'text/html',
            'Connection': 'close',
            'User': user, // unique username
            'Pass': pass, // secretPassword
            'Mode': mode, // 'login', 'perms', 'get', 'save'
            'List': list, // otherUser/alist -- alist
          }
    };
    return httpsOptions;
}
function trySaveListToServer(listString) { // this doesnt need to be async, but maybe give a notification if it failed
    //get username and password
    let username = db.get('uuid');
    let password = db.get('password');

    // Communicate with server:
    console.log("Attempting to save to Server..");
    const req = https.request(getHttpsOptions(username,password,'save',currentListName,listString.length), (res) => {

        // if res.statusCode == 200 {give notification} else {give bad notification}
        var data = ''
        res.on('data', (d) => { // large data might come in chunks
            data += d;
            console.log("response: " + d);
        });

        res.on('end', () => { // done chunking all data
            //resolve(data); // whatever is passed to resolve goes to the Promises .then params
        });

    }).on('error', (e) => {
        console.error("[HTTPS SAVE] " + e);
    });

    req.write(listString);
    req.end();
}

async function tryLoginToServer(username, password) {
    try {
        const response = await getLoginResponse(username,password);
        console.log(response + " is the response")
        return response == 200;
      } catch (error) {
        console.error('Error:', error);
        return false;
      }
}

async function getLoginResponse(username, password) {
    console.log("Attempting to login to Server..");
    return new Promise((resolve, regect) => {
    https.get(getHttpsOptions(username,password,'login','',0), (res) => {
        console.log('[HTTPS] statusCode:', res.statusCode);
        console.log('[HTTPS] headers:', res.headers);
        var data = ''
        res.on('data', (d) => { // large data might come in chunks
            data += d;
        });

        res.on('end', () => { // done chunking all data
            resolve(res.statusCode);
        });
    
        }).on('error', (e) => {
            console.error("[HTTPS LOGIN] " + e);
            regect(e);
        });
    });
}

async function tryLoadList(listPath) {
    try {
        const response = await getListResponse(listPath);
        if (response.statusCode == 200) {
            return response.data;
        } else {
            console.log("problem loading list " + listPath);
            return "";
        }
      } catch (error) {
        console.error('Error:', error);
        return "";
    }
}

async function getListResponse(listPath) {
    console.log("Attempting to load list from Server..");
    //get username and password
    let username = db.get('uuid');
    let password = db.get('password');

    return new Promise((resolve, regect) => {
    https.get(getHttpsOptions(username,password,'get',listPath,0), (res) => {
        console.log('[HTTPS] statusCode:', res.statusCode);
        console.log('[HTTPS] headers:', res.headers);
        var data = ''
        res.on('data', (d) => { // large data might come in chunks
            data += d;
        });

        res.on('end', () => { // done chunking all data
            resolve({
                statusCode: res.statusCode,
                data: data
            }); // whatever is passed to resolve goes to the Promises .then params
        });
    
        }).on('error', (e) => {
            console.error("[HTTPS GET] " + e);
            regect(e);
        });
    });
}

var bodyString = '\"title\",\"notes\",\"rating\",\"tags\",\"date\",\"image\"\n\"BACKU\\P LIST\",\"WRONG DB, CHOOSE ANOTHER LIST\",\"0\",\"\",\"Jan 01 2001\",\"\"';
