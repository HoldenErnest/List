// Holden Ernest - 1/11/2024
// This handles all of the actual application proccesses

const {ipcRenderer} = require('electron');
const fs = require("fs");
const path = require('node:path');


const saveBtn = document.getElementById("save");
const loadListBtn = document.getElementById("load-list");

//Event listeners
saveBtn.addEventListener('click', onButtonSave);
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
        var listArray = parseToArray(data,',');
        console.log('loading ' + listArray.length + ' items to the list');
        displayListItems(listArray);
        // I guess just use in the async function?
        // load each list item here
    });

}

function displayListItems(listData) {
    let itemCount = document.querySelectorAll('.item').length + 1;
    for(let i = 0; i < listData.length; i++) {
        displayListItem(listData[i], itemCount+i);
    }
    // TODO: sort by whatever, then display, maybe in a displaySorted(sortby)
}
function displayListItem(itemData, itemID) {
    var original = document.getElementById('tempListItem');
    if (original == null) return;
    var clone = original.cloneNode(true); // "deep" clone
    clone.id = '';
    // set all of these clones child divs to use the listItem information
    clone.getElementsByClassName("item-id")[0].innerHTML = itemID | document.querySelectorAll('.item').length + 1; // probably better to do this query once before the for loop earlier
    clone.getElementsByClassName("item-title")[0].innerHTML = itemData.title;
    clone.getElementsByClassName("item-tags")[0].innerHTML = itemData.tags;
    clone.getElementsByClassName("item-rating")[0].innerHTML = itemData.rating;


    //clone.onclick = duplicate; // might need to add listeners to this clone
    original.parentNode.appendChild(clone);
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