// Holden Ernest - 1/11/2024
// This handles all of the actual application proccesses

const saveBtn = document.getElementById("save");
const loadListBtn = document.getElementById("load-list");
const searchbar = document.getElementById("searchbar");
const escapeFocusElem = document.getElementById("escape-focus");
const sortBtn = document.getElementById("sort-list");

//Event listeners
//saveBtn.addEventListener('click', onButtonSave);
//loadListBtn.addEventListener('click', loadList);
searchbar.addEventListener('input', updateSearch);
document.getElementById("sort-list").onchange = sort_all;
document.getElementById("sort-order").onchange = sort_all;
document.getElementById("save-btn").onclick = saveList;

var madeChange = false; // determine when the save button needs to appear
var lastImageEdit; // determine what item to put the image in when its done async loading
var lastImageNumber = 0;
function sort_all() {
    var sortOrder = document.getElementById("sort-order").value;
    var toSort = document.getElementById('list-items').children;
    toSort = Array.prototype.slice.call(toSort, 0);
    toSort.sort(function(a, b) {
        let nameA = a.getElementsByClassName(`item-${sortBtn.value}`)[0].innerHTML.toLowerCase();
        let nameB = b.getElementsByClassName(`item-${sortBtn.value}`)[0].innerHTML.toLowerCase();
        if (sortBtn.value == "rating") {
            console.log(0,nameA.slice(nameA.indexOf('/')));
            nameA = parseInt(nameA.slice(0,nameA.indexOf('/')));
            nameB = parseInt(nameB.slice(0,nameB.indexOf('/')));
        } else if (sortBtn.value == "date") {
            nameA = Date.parse(nameA);
            nameB = Date.parse(nameB);
        }
        if (nameA < nameB) return -sortOrder;
        if (nameA > nameB) return sortOrder;
        return 0;
    });
    var parent = document.getElementById('list-items');
    parent.innerHTML = "";

    for(var i = 0, l = toSort.length; i < l; i++) {
        parent.appendChild(toSort[i]);
        toSort[i].getElementsByClassName("item-id")[0].innerHTML = i+1;
    }
}
function makeEditable(item) {
    item.getElementsByClassName("item-title")[0].ondblclick=function(){
        var val=this.innerHTML;
        var input=document.createElement("input");
        input.value=val;
        input.className = 'editable';
        input.onchange = madeEdit;
        input.onblur=function(){
            var val=this.value;
            this.parentNode.innerHTML=val;
        }
        this.innerHTML="";
        this.appendChild(input);
        input.focus();
    }
    item.getElementsByClassName("item-tags")[0].ondblclick=function(){
        var val = this.innerHTML;
        var input = document.createElement("input");
        input.value = val;
        input.className = 'editable';
        input.onchange = madeEdit;
        input.onblur = function() {
            var val = this.value;
            console.log(val + "is the val");
            this.parentNode.innerHTML = val;
        }
        this.innerHTML="";
        this.appendChild(input);
        input.focus();
    }
    item.getElementsByClassName("item-rating")[0].ondblclick = function(){
        var val = this.innerHTML;
        var input = document.createElement("input");
        input.value = val;
        input.style.width = "40px";
        input.type = "number";
        input.className = 'editable';
        input.onchange = madeEdit;
        input.onblur = function() {
            var val = this.value;
            val = val > 10 ? 10 : val;
            this.parentNode.innerHTML = val | "0";
        }
        this.innerHTML = "";
        this.appendChild(input);
        input.focus();
    }
    item.getElementsByClassName("item-date")[0].ondblclick = function(){
        var val = this.innerHTML;
        var input = document.createElement("input");
        input.value = val;
        input.onchange = madeEdit;
        input.className = 'editable';
        input.onblur = function() {
            var val = this.value;
            val = val ? new Date(val).toDateString().replace(/^\S+\s/,'') : new Date().toDateString().replace(/^\S+\s/,'')
            this.parentNode.innerHTML = val; // TODO: ternery current date
        }
        this.innerHTML = "";
        this.appendChild(input);
        input.focus();
    }
}
function madeEdit() {
    if (madeChange) return;
    madeChange = true;
    //bring up the save menu if !madeChange
    showSaveButton();
}
function showSaveButton() {
    var saveBtn = document.getElementById("save-check");
    saveBtn.checked = true;

}
function saveList() {
    madeChange = false;
    var allItems = document.querySelectorAll('#list-items .item');
    var csvString = "";
    for (let i = 0; i < allItems.length; i++) { // Optimization? what?
        csvString += "\"";
        // TODO: make sure these are all csv safe
        csvString += allItems[i].getElementsByClassName("item-title")[0].innerHTML.replaceAll("\"","'");
        csvString += "\",\"";
        csvString += allItems[i].getElementsByClassName("item-notes")[0].value.replaceAll("\"","'").replaceAll("\n","\\n");
        csvString += "\",\"";
        csvString += allItems[i].getElementsByClassName("item-rating")[0].innerHTML | "-";
        csvString += "\",\"";
        csvString += allItems[i].getElementsByClassName("item-tags")[0].innerHTML.replaceAll(", "," ");
        csvString += "\",\"";
        csvString += allItems[i].getElementsByClassName("item-date")[0].innerHTML;
        csvString += "\",\"";
        var img = allItems[i].querySelectorAll(".item-image div")[0],
        style = img.currentStyle || window.getComputedStyle(img, false),
        imgUrl = style.backgroundImage.slice(65, -1).replace(/"/g, "");
        if (!imgUrl.startsWith("file://")) // if you dont have any unique url, dont save it
            csvString += imgUrl;

        csvString += "\"\n";
    }
    window.api.send("save-list", csvString);
}
function getParentItem(subElement) { // get the item if its a parent of the subElement
    if (!subElement || subElement.className == 'item') return subElement;
    return getParentItem(subElement.parentElement);
}
document.onkeydown = function(event) {
    var source = event.target;
    if (event.key == "Enter" || event.key == "Escape") {
        if (source.className === 'editable') {
            getParentItem(source).focus();
        } else if (source.className != 'item-notes'){
            console.log("escape focus");
            escapePress();
        }
        return;
    }
    exclude = ['input', 'textarea'];
    if (exclude.indexOf(source.tagName.toLowerCase()) === -1) {
        if (isTypableKey(event.key)) { // start typing in the searchbar if its a letter
            focusSearch();
        }
    }
};
function isTypableKey(key) {
    return (key >= 'A' && key <= 'Z') || (key >= 'a' && key <= 'z') || key == '#' || (key >= '0' && key <= '9');
}
function escapePress() {
    escapeFocusElem.focus();
}
function loadList() {
    window.api.send("load-list", 'templist.csv');
    // have main load the list, which will eventually be brought back through "display-list"
    // this is essentially "IPCrenderer.send"
    // TODO: have it clear the previous list first once you can choose different lists
}
function updateSearch() {
    var searched = searchbar.value;
    if (searched == "") {
        showAllItems();
        return;
    }

    // find any tag or rating searches within this string
    const ratingEx = /\d{1,2}\/10/;
    var searchRating = ratingEx.exec(searched);
    const tagsEx = /#\w+/g;
    var searchTags = searched.match(tagsEx); // to get an array of multiple, you need to use match
    
    // remove the other searched terms from the title search
    if (searchRating) searched = searched.replace(ratingEx, "");
    if (searchTags) searched = searched.replace(tagsEx, "");
    searched = searched.replaceAll(/\s+/g, ' '); // remove all extraneous spaces from the title / clean it up
    searched = searched.replaceAll("#", '')
    searched = searched.trim();
    if (searched == "") searched = null;

    // loop through all DOM items (except the placeholder one)
    var items = Array.from(document.getElementsByClassName("item"));
    if (!items || items.length <= 1) { console.error("there are no items?"); return; }
    for(let i = 1; i < items.length; i++) {
        // Item components
        let theItemTitle = items[i].getElementsByClassName("item-title")[0].innerHTML.toLowerCase();
        let theItemRating = items[i].getElementsByClassName("item-rating")[0].innerHTML.toLowerCase();
        let theItemTags = items[i].getElementsByClassName("item-tags")[0].innerHTML.toLowerCase();

        // test if the item has your search
        let hasSearchedTitle = (!searched || theItemTitle.includes(searched.toLowerCase()));
        let hasSearchedRating = (!searchRating || theItemRating == searchRating);
        let hasSearchedTags = () => {
            if (!searchTags) return true;
            console.log(searchTags.length + " is the leng")
            for (let i = 0; i < searchTags.length; i++){ // if any of the searched tags arent in the item, hide it
                searchTags[i] = searchTags[i].replace("#","");
                if (!theItemTags.toLowerCase().includes(searchTags[i].toLowerCase())) return false;
            }
            return true;
        }
        if ( hasSearchedTitle && hasSearchedRating && hasSearchedTags()) {
            items[i].style.display = 'block';
        } else {
            items[i].style.display = 'none';
        }
    }
    
}
function focusSearch() {
    if (searchbar.value)
        searchbar.value = "";
    searchbar.focus();
}
function showAllItems() {
    var items = document.getElementsByClassName("item");
    // skip the placeholder item
    for(let i = 1; i < items.length; i++) {
        items[i].style.display = 'block';
    }
}
function removeItem(anItem) {
    anItem.remove();
    madeEdit();
    sort_all();
}
function requestImageUrl(anItem, urlNum) {
    var searchText = anItem.getElementsByClassName("item-title")[0].innerHTML;
    lastImageEdit = anItem.querySelectorAll(".item-image div")[0];
    lastImageNumber = urlNum;
    if (anItem.querySelectorAll(".item-image div")[0].value) {
        urlString = anItem.querySelectorAll(".item-image div")[0].value;
        updateImage(lastImageEdit, urlString.split("\n")[lastImageNumber])
        return;
    }
    window.api.send("get-urls", searchText);
}
function updateImage(theItemImage, url) {
    theItemImage.style.background = `linear-gradient(to left, transparent, #222), url("${url}")`;
    theItemImage.style.backgroundRepeat = "no-repeat";
    theItemImage.style.backgroundSize = "cover";
    theItemImage.style.backgroundPosition = "center";
}
window.api.receive('update-image', (urls) => {
    console.log("urls: " + urls); 
    var urlString = "";
    urls.map((u) => {urlString += u + "\n"});
    console.log(urlString + " is the return")
    lastImageEdit.value = urlString;
    url = urls[lastImageNumber];
    updateImage(lastImageEdit, url); // this may not be the item you want unfortunatly, I dont know how to pass the item through when you request a url
    madeEdit();
});

window.api.receive('display-list', (listData) => {
    // when Main wants a list displayed (this is essentially "IPCrenderer.on")
    displayListItems(listData);
});
function displayListItems(listData) {
    let itemCount = document.querySelectorAll('#list-items .item').length + 1;
    for(let i = 0; i < listData.length; i++) {
        displayListItem(listData[i], itemCount+i);
    }
    sort_all();
}
function displayListItem(itemData, itemID) {
    var original = document.getElementById('placeholder-item');
    if (original == null) return;
    var clone = original.cloneNode(true); // "deep" clone
    clone.id = '';
    // set all of these clones child divs to use the listItem information
    clone.getElementsByClassName("item-id")[0].innerHTML = itemID || document.querySelectorAll('#list-items .item').length; // if an id is passed in use that (might be unnessecary if the selector is efficient)
    clone.getElementsByClassName("item-title")[0].innerHTML = itemData.title;
    clone.getElementsByClassName("item-tags")[0].innerHTML = itemData.tags;
    clone.getElementsByClassName("item-rating")[0].innerHTML = itemData.rating;
    clone.getElementsByClassName("item-notes")[0].innerHTML = itemData.notes;
    clone.getElementsByClassName("item-notes")[0].onchange = madeEdit;
    clone.getElementsByClassName("delete-item")[0].addEventListener("click", function(evt) {
        removeItem(clone); // remove this element if you delete
    });
    clone.getElementsByClassName("item-date")[0].innerHTML = (new Date(itemData.date)).toDateString().replace(/^\S+\s/,'');
    var linkButtons = clone.getElementsByClassName("change-item-image")[0];
    for (let i = 1; i < linkButtons.children.length; i++) {
        linkButtons.children[i].addEventListener("click", function(evt) {
            requestImageUrl(clone, i-1); // << the event when you click an item image
        });
    }

    if (itemData.image) { // if it has a unique image url, make sure to update it
        updateImage(clone.querySelectorAll(".item-image div")[0], itemData.image)
    }
    //clone.onclick = clickItem;
    makeEditable(clone);
    var parent = document.getElementById('list-items');
    parent.appendChild(clone);
}
/* // alternate click item method for if I need more functionality
function clickItem() {
    this.focus();
    console.log("You've cliked to : " + this);
}*/

function retrieveAllListNames() { // get an array of the list names available to this user (so you can tell what list youre loading)
    
}