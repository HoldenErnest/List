// Holden Ernest - 1/12/2024
// simple script to handle the front end of logging in

const {ipcRenderer} = require('electron');

let login = document.getElementById('login');
let loginUser = document.getElementById('loginUser');
let loginPass = document.getElementById('loginPass');
console.log(login);
login.addEventListener('click', () => {
    ipcRenderer.send('attempt-login', loginUser.value, loginPass.value);
});