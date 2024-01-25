// Holden Ernest - 1/11/2024
// This handles all of the actual application proccesses

const saveBtn = document.getElementById("save");
const loadListBtn = document.getElementById("load-list");
const searchbar = document.getElementById("searchbar");
const escapeFocus = document.getElementById("escape-focus");
const sortBtn = document.getElementById("sort-list");

//Event listeners
saveBtn.addEventListener('click', onButtonSave);
loadListBtn.addEventListener('click', loadList);
searchbar.addEventListener('input', updateSearch);
document.getElementById("sort-list").onchange = sort_all;
document.getElementById("sort-order").onchange = sort_all;

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

document.onkeydown = function(event) {
    if (event.key == "Escape") {//27 is the code for escape
        escapePress();
        return;
    }
    var source = event.target;
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
function onButtonSave() {
    alert('asdasfasfa');
}
function escapePress() {
    escapeFocus.focus();
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
    clone.getElementsByClassName("item-id")[0].innerHTML = itemID | document.querySelectorAll('#list-items .item').length; // if an id is passed in use that (might be unnessecary if the selector is efficient)
    clone.getElementsByClassName("item-title")[0].innerHTML = itemData.title;
    clone.getElementsByClassName("item-tags")[0].innerHTML = itemData.tags.replaceAll(" ",", ");
    clone.getElementsByClassName("item-rating")[0].innerHTML = itemData.rating + '/10';
    clone.getElementsByClassName("item-notes")[0].innerHTML = itemData.notes;
    //clone.onclick = clickItem;
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