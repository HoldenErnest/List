// Holden Ernest - 1/11/2024
// This handles all of the actual application proccesses

const {ipcRenderer} = require('electron');

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
    var csvString = ipcRenderer.send('load-list', 'templist');
    if (csvString == null) {
        console.error("problem loading the file: output is null");
        return;
    }
    console.log(csvString);
    var listArray = parseToArray(csvString,',');
    console.log(listArray);
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