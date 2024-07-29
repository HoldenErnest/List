// Holden Ernest - 1/11/2024
// This will load the page into a window

const { app, BrowserWindow, ipcMain} = require('electron');
if (require('electron-squirrel-startup')) app.quit();
const path = require('node:path');

const fs = require("fs");
const JSONdb = require('simple-json-db');
const db = new JSONdb(path.join(app.getPath("userData"), 'userPrefs.json'));
var mainWindow;

require('dotenv').config();
var imageSearch = require('image-search-google');
var imgSearch = new imageSearch(process.env.CSE_ID, process.env.IMG_API_KEY);
const imgOptions = {page:1};

var currentListName; // keep track of the list youre currently displaying to renderer

const createWindow = (fileName) => { // function to make the window
    const win = new BrowserWindow({
        icon: path.join(__dirname, 'images/icon.png'),
        autoHideMenuBar: true,
        width: 720, // 800
        height: 1600, // 600
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
    if (!username || !password) return false;
    return correctLoginCreds(username, password);
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
function saveList(csvString) {
    var serverHasFile = false; // TODO: request to server to see if it has a list, if not display client version list or show error
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
}
function displayList(fileName) {
    var serverHasFile = false; // TODO: request to server to see if it has a list, if not display client version list or show error
    fileName = fileName || "newList";
    currentListName = fileName;
    db.set("lastList",fileName);

    var fullPath = "";
    if (!serverHasFile) {
        fullPath = path.join(app.getPath("userData"), "clientLists");
        if (!fs.existsSync(fullPath)){
            return;
        }
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