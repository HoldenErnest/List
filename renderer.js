// Holden Ernest - 1/11/2024
// This handles all of the actual application proccesses

const {ipcRenderer} = require('electron');
const fs = require("fs");
const path = require('node:path');


const saveBtn = document.getElementById("save");
const exitBtn = document.getElementById("exit");
const loadListBtn = document.getElementById("load-list");

//Event listeners
saveBtn.addEventListener('click', onButtonSave);
exitBtn.addEventListener('click', onButtonExit);
loadListBtn.addEventListener('click', retrieveList);

function onButtonSave() {
    alert('asdasfasfa');
}
function onButtonExit() {
    alert('Hello2');
}

function retrieveList() { // this will be later loaded from a server instead of local
    fs.readFile(path.join(__dirname, 'templist.csv'), 'utf8', function (err, data) {
        if (err) return console.error(err);
        // data is the contents of the text file we just read
        console.log(data);
        var listArray = parseToArray(data,',');
        console.log(listArray);
        // I guess just use in the async function?
        // load each list item here
    });

}

function parseToArray(stringVal, splitter) {
    const [keys, ...rest] = stringVal
      .trim()
      .split("\n")
      .map((item) => item.split(splitter));
    const formedArr = rest.map((item) => {
      const object = {};
      keys.forEach((key, index) => (object[key] = item.at(index)));
      return object;
    });
    return formedArr;
}

function retrieveAllListNames() { // get a list of the list names available to this user (so you can tell what list youre loading)
    
}