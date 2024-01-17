// Holden Ernest - 1/11/2024
// This handles all of the actual application proccesses

const saveBtn = document.getElementById("save");
const loadListBtn = document.getElementById("load-list");

//Event listeners
saveBtn.addEventListener('click', onButtonSave);
loadListBtn.addEventListener('click', loadList);

function onButtonSave() {
    alert('asdasfasfa');
}
function loadList() {
    window.api.send("load-list", 'templist.csv');
    // have main load the list, which will eventually be brought back through "display-list"
    // this is essentially "IPCrenderer.send"
    // TODO: have it clear the previous list first 
}

window.api.receive('display-list', (listData) => {
    // when Main wants a list displayed (this is essentially "IPCrenderer.on")
    console.log(listData);
    displayListItems(listData);
});
function displayListItems(listData) {
    let itemCount = document.querySelectorAll('#list-items .item').length;
    for(let i = 0; i < listData.length; i++) {
        displayListItem(listData[i], itemCount+i);
    }
    // TODO: sort by whatever, then display, maybe in a displaySorted(sortby)
}
function displayListItem(itemData, itemID) {
    var original = document.getElementById('placeholder-item');
    if (original == null) return;
    var clone = original.cloneNode(true); // "deep" clone
    clone.id = '';
    // set all of these clones child divs to use the listItem information
    clone.getElementsByClassName("item-id")[0].innerHTML = itemID | document.querySelectorAll('#list-items .item').length; // probably better to do this query once before the for loop earlier
    clone.getElementsByClassName("item-title")[0].innerHTML = itemData.title;
    clone.getElementsByClassName("item-tags")[0].innerHTML = itemData.tags.replaceAll(" ",", ");
    clone.getElementsByClassName("item-rating")[0].innerHTML = itemData.rating + '/10';
    //clone.onclick = clickItem;
    original.parentNode.appendChild(clone);
}
/* // alternate click item method for if I need more functionality
function clickItem() {
    this.focus();
    console.log("You've cliked to : " + this);
}*/

function retrieveAllListNames() { // get an array of the list names available to this user (so you can tell what list youre loading)
    
}