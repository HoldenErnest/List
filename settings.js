
document.getElementById("generalButton").onclick = () => showContent("general");
document.getElementById("listsButton").onclick = () => showContent("lists");
document.getElementById("otherButton").onclick = () => showContent("other");

function showContent(selectedDiv) {
    // Hide all content divs
    const divs = document.querySelectorAll('.content');
    divs.forEach(div => {
        div.style.display = 'none';
    });

    // Show the selected div
    document.getElementById(selectedDiv).style.display = 'block';
}
updateLists(); // TEMP DELETE LATER

function displayLists() {
    // TODO: ask server for list of lists
    //updateLists()
}
function updateLists() {
    const allLists = Array.from(document.getElementById("allLists").children);

    allLists.forEach((l) => {
        console.log(l.innerHTML + " things");
        l.onclick = () => {selectList(l.innerHTML)};
    });
}
function selectList(listName) {
    const renameField = document.getElementById("listRename");
    renameField.value = listName;
    renameField.tagName = listName;
    loadPerms(listName);
}
function loadPerms(listName) {
    // TODO: ask the server for a list of perms for this list
    // make everything greyed out by default
    // WHEN THE PERMS ARE LOADED.. make them visible IF you are the owner
}
function attemptListRename() {
    const renameField = document.getElementById("listRename");
    var newName = renameField.value;
    var oldName = renameField.tagName;
    if (newName == oldName) return;
    //renameField.value = renameField.value.replace(/\./g, "");
    // TODO: send to server, update list name from renameField.tagName
}