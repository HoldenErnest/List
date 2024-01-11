// Holden Ernest - 1/11/2024
// This handles all of the actual application proccesses
const saveBtn = document.getElementById("save");
const exitBtn = document.getElementById("exit");

//Event listeners
saveBtn.addEventListener('click', onButtonSave);
exitBtn.addEventListener('click', onButtonExit);

function onButtonSave() {
    alert('asdasfasfa');
}
function onButtonExit() {
    alert('Hello2');
}

function retrieveList() { // this will be later loaded from a server instead of local
    
}
function retrieveAllListNames() { // get a list of the list names available to this user (so you can tell what list youre loading)
    
}