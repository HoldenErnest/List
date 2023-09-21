import li from "./listItem.js"

var theList = [2];

function newEntry() {
    var isHidden = document.getElementById("create").style.display == "none"
    if (isHidden)
        document.getElementById("create").style.display = "block";
    else
    document.getElementById("create").style.display = "none";
}

function sortBy(value) {
    
    switch (value){
        case '1':
            console.log("sort by title");
            break;
        case '2':
            console.log("sort by rating");
            break;
        case '3':
            console.log("sort by other");
            break;
        default:
            console.log("not a choice");
            break;
    }
}
function addListItem() {
    theList.push(1);
    var eDiv = document.getElementById("allEntries");
    eDiv.setAttribute("style","height:"+ (theList.length * 30) +"px");
}

function toListItem(item) {
    var newItem = new li.ListItem();
}