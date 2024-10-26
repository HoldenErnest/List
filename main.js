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
var userMetaData;
var mainWindow;
var otherMenu;

require('dotenv').config();
var imageSearch = require('image-search-google');
const { Console } = require('node:console');
var imgSearch = new imageSearch(process.env.CSE_ID, process.env.IMG_API_KEY);
const imgOptions = {page:1};

var currentListName; // keep track of the list youre currently displaying to renderer

/*
    FOR REAL BUILD:
    set getHttpsOptions.regectUnauthorized = true
    set getHttpsOptions.hostname = 'hosted.dns'
    replace instances of ('process.env.CSE_ID', 'process.env.IMG_API_KEY', ect)
    from the variables in .env
    include 'win.removeMenu()' in createWindow

    FOR TEST PURPOSES:
    set getHttpsOptions.regectUnauthorized = false
    set getHttpsOptions.hostname = '127.0.0.1'
    replace instances of secrets ('process.env.CSE_ID', 'process.env.IMG_API_KEY', ect)
    remove 'win.removeMenu()' from createWindow

    */


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
    win.loadFile(`${fileName}.html`);
    win.removeMenu(); // YOU CAN REMOVE, this will allow inspect element
    mainWindow = win;
}
function createOtherWindow(optionsObject) {
    const win = new BrowserWindow({
    icon: path.join(__dirname, 'images/icon.png'),
        autoHideMenuBar: true,
        width: 640, // 800
        height: 480, // 600
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, `${optionsObject.pagename}Preload.js`)
        }
    })
    win.loadFile(`${optionsObject.pagename}.html`);
    win.removeMenu(); // YOU CAN REMOVE, this will allow inspect element
    otherMenu = win;
}

app.whenReady().then(async () => { // Start the application
    if (await isSignedIn()) {
        createWindow('index'); // if the user is signed in(locally), have them go to the home page, otherwise re-login
    } else createOtherWindow({pagename:'login'});
    app.on('activate', async () => { // allow event listener after the window is created
        if (BrowserWindow.getAllWindows().length === 0) {
            if (await isSignedIn()) {
                createWindow('index');
            } else createOtherWindow({pagename:'login'});
        }
    })
})

app.on('window-all-closed', () => { // CLOSE THE APP
    if (process.platform !== 'darwin') app.quit();
})



ipcMain.on('attempt-login', async (event, loginInfo) => { // open specified page
    if (await correctLoginCreds(loginInfo.user, loginInfo.pass)) {
        if (otherMenu) otherMenu.close();
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
        userMetaData = new JSONdb(path.join(app.getPath("userData"), 'clientLists', username, 'metaData.json'));
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
    saveList(csvString, true);
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
    var username = db.get('uuid');
    var fullPath = getCurrentListPath();
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
ipcMain.on('open-settings', (event, infoObject) => {
    console.log("opening settings for " + infoObject.listName);
    if (!(BrowserWindow.getAllWindows().length > 1)) {
        var settingsWindow = createOtherWindow({pagename:'settings'});
    }
});
// END EVENTS


function saveList(csvString, saveRemote) {
    var serverHasFile = false;
    var fileName = currentListName;

    var fullPath = "";
    fullPath = getCurrentListPath();
    if (!fs.existsSync(fullPath)){
        fs.mkdirSync(fullPath);
    }
    fullPath = path.join(fullPath,fileName);
    fullPath += ".csv";
    
    if (saveRemote) csvString = "\"title\",\"notes\",\"rating\",\"tags\",\"date\",\"image\"\n" + csvString;
    fs.writeFile(fullPath, csvString, err => {
        if (err) {
          console.error(err);
        } else {
          console.log("Locally chached file: '" + fileName + "'!")
        }
    });
    if (saveRemote)
        trySaveListToServer(csvString);
}
async function displayList(fileName) {
    fileName = fileName || "newList";
    currentListName = fileName;
    db.set("lastList",fileName);

    // read from a local file instead
    console.log("reading /" + fileName + " locally");
    var fullPath = "";
    fullPath = getCurrentListPath();
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

    // The chached list should be shown at this point, but check the server if there were any changes
    var serverData = await tryLoadList(fileName);
    
    if (serverData != "") { // if the server actually has new data to show, load that instead
        var listArray = parseToArray(serverData);
        saveList(serverData, false); // cache this list locally when you load it
        mainWindow.webContents.send("display-list", listArray);
        return;
    }

}
async function updateAvailableLists() {
    var fullPath = "";
    var files = [];

    var serverData = await tryGetLists();
    if (serverData) { // get all server-available lists for this user
        files = serverData.split(' ');
    } else {
        console.log("Loading names of all lists locally");
        fullPath = getCurrentListPath(); // ClientLists/username
        if (!fs.existsSync(fullPath)){
            return;
        }
        files = fs.readdirSync(fullPath);
        files = files.map((name) => {
            if (name.length <= 4 || !name.endsWith('.csv')) return null;
            return name.substring(0,name.length - 4);
        });
    }
    
    files = files.filter( n => n); // remove all null elements
    console.log(`Path: ${fullPath} contains: ${files}`);
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
function getCurrentListPath() {
    return path.join(app.getPath("userData"), "clientLists", db.get('uuid'));
}
function getCurrentListVersion() {
    return parseInt(userMetaData.get(db.get('lastList')+'-ver'));
}

function sendNotification(type,message) {
    mainWindow.webContents.send("send-notification", {type:type,message:message});
}

// SERVER CONNECTION STUFF---------------------------------
function getHttpsOptions(user, pass, mode, list, contentLen, version) {
    var httpsOptions = {
        hostname: '127.0.0.1', //'127.0.0.1'
        path: "/",
        rejectUnauthorized: false, // [WARNING] - this is only for localhost purposes (remove this to make sure the client accepts that the IP is what the CA says it is)
        port: 2001,
        method: 'lupu',
        timeout: 3000,
        headers: {
            'Content-Length': contentLen,
            'Content-Type': 'text/html',
            'Connection': 'close',
            'User': user, // unique username
            'Pass': pass, // secretPassword
            'Mode': mode, // 'login', 'perms', 'get', 'save'
            'List': list, // otherUser/alist -- alist
            'Version': version ? version : 0, // what is this version. millisSinceEpoch // this represents the base version
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
    const req = https.request(getHttpsOptions(username,password,'save',currentListName,listString.length, getCurrentListVersion()), (res) => {
        var data = ''
        res.on('data', (d) => { // large data might come in chunks
            data += d;
            console.log("response: " + d);
        });

        res.on('end', () => { // done chunking all data
            const version = parseInt(res.headers['version']);
            if (res.statusCode == 200) {
                userMetaData.set(db.get("lastList")+'-ver', version);
                sendNotification('success','List Saved..');
            } else if (parseInt(res.statusCode/100) == 3) {
                if (res.statusCode == 300)
                    sendNotification('error','Conflict saving: You made changes to an outdated version of the list');
                else if (res.statusCode == 301) {
                    sendNotification('error','You are not allowed write permissions to this list');
                }
                
                // TODO:? Maybe do things with conflict merging instead of replacing

                saveList(data, false); // make sure the cache is reset
                userMetaData.set(db.get("lastList")+'-ver', version);
                // send the data to be displayed
                var listArray = parseToArray(data);
                mainWindow.webContents.send("display-list", listArray);
                

            } else console.log("Weird status code for write");
        });

    })
    req.on('error', (e) => {
        sendNotification('warning','Connection Error: List Saved Locally..');
        console.error("[HTTPS Write] " + e);
    });
    req.on('timeout', () => {
        sendNotification('warning','Connection Timeout');
        req.destroy();
    });

    req.write(listString);
    req.end();
}

async function tryLoginToServer(username, password) {
    try {
        const response = await getLoginResponse(username,password);
        console.log(response.statusCode + " GET response");
        return response.statusCode == 200;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

async function getLoginResponse(username, password) {
    console.log("Attempting to login to Server..");
    return new Promise((resolve, regect) => {
        const req = https.request(getHttpsOptions(username,password,'login','',0, 0), (res) => {
            var data = '';
            res.on('data', (d) => { // large data might come in chunks
                data += d;
            });

            res.on('end', () => { // done chunking all data
                resolve(res);
            });
        
        });
        req.on('error', (e) => {
            console.error("[HTTPS LOGIN] " + e);
            regect(400);
        });
        req.on('timeout', () => {
            req.destroy();
            regect(400);
        });
        req.end();
    });
}

async function tryLoadList(listPath) {
    try {
        const response = await getListResponse(listPath);
        if (response.statusCode == 200) {
            sendNotification("success","Loaded more recent list from server..");
            userMetaData.set(db.get("lastList")+'-ver', parseInt(response.version));
            return response.data;
        } else {
            console.log("List not retrieved from server: " + listPath);
            return "";
        }
      } catch (error) {
        console.error('READ ERROR:', error);
        return "";
    }
}

async function getListResponse(listPath) {
    console.log("Attempting to load list from Server..");
    //get username and password
    let username = db.get('uuid');
    let password = db.get('password');

    return new Promise((resolve, regect) => {
        const req = https.request(getHttpsOptions(username,password,'get',listPath,0, getCurrentListVersion()), (res) => { // TODO: change version 
            var data = ''
            res.on('data', (d) => { // large data might come in chunks
                data += d;
            });

            res.on('end', () => { // done chunking all data
                console.log('[HTTPS] headers:', res.headers);
                resolve({
                    statusCode: res.statusCode,
                    data: data,
                    version: res.headers['version']
                }); // whatever is passed to resolve goes to the Promises .then params
            });
    
        });
        req.on('error', (e) => {
            console.error("[HTTPS GET] " + e);
            regect(e);
        });
        req.on('timeout', () => {
            req.destroy();
            regect("Connection Timeout");
        });
        req.end();
    });
}

async function tryGetLists() {
    try {
        const response = await getAllListsResponse();
        if (response.statusCode == 200) {
            return response.data;
        } else {
            console.log("problem loading all Lists " + listPath);
            return "";
        }
      } catch (error) {
        console.error('READ ERROR:', error);
        return "";
    }
}
async function getAllListsResponse() {
    console.log("Attempting to retrieve names of lists on server..");
    let username = db.get('uuid');
    let password = db.get('password');

    return new Promise((resolve, regect) => {
        const req = https.request(getHttpsOptions(username,password,'lists','',0, 0), (res) => { // TODO: change version 
            var data = ''
            res.on('data', (d) => { // large data might come in chunks
                data += d;
            });

            res.on('end', () => { // done chunking all data
                resolve({
                    statusCode: res.statusCode,
                    data: data,
                    version: res.headers['version']
                }); // whatever is passed to resolve goes to the Promises .then params
            });
    
        });
        req.on('error', (e) => {
            regect(e);
        });
        req.on('timeout', () => {
            req.destroy();
            regect("Connection Timeout");
        });
        req.end();
    });
}

var testListString = '\"title\",\"notes\",\"rating\",\"tags\",\"date\",\"image\"\n\"BACKU\\P LIST\",\"WRONG DB, CHOOSE ANOTHER LIST\",\"0\",\"\",\"Jan 01 2001\",\"\"';
