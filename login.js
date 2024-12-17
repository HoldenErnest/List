// Holden Ernest - 1/12/2024
// simple script to handle the front end of logging in

let login = document.getElementById('login');
let loginUser = document.getElementById('loginUser');
let loginPass = document.getElementById('loginPass');
const offlineButton = document.getElementById('offline-button');
login.addEventListener('click', () => {
    window.api.send('attempt-login', {user: loginUser.value, pass: loginPass.value});
});
offlineButton.addEventListener('click', () => {
    window.api.send('start-offline', {});
});

//NOTIFICAITON STUFF
window.api.receive('send-notification', (notiObj) => {
    displayNotification(notiObj.type,notiObj.message);
});
function displayNotification(type, message) { // display a notification of a certain type.
    // type can be either 'success' 'warning' 'error'
    //animation handled with css
    console.log("notification["+ type + "]: " + message)
    const newNoti = newNotificationItem(type,message);
    fadeOutAfter(newNoti,5); // set fade effect
}
function newNotificationItem(type, message) { // create a new HTML element for a notification
    var original = document.getElementById('placeholder-noti');
    if (original == null) return;
    var clone = original.cloneNode(true); // "deep" clone
    clone.classList.remove("placeholder");
    clone.classList.add(type);
    clone.id = '';
    clone.innerHTML = message;
    notiDiv = document.getElementById('notification-area');
    notiDiv.appendChild(clone);
    return clone;
}

function fadeOutAfter(element, seconds) {
    const fadeEffectTime = 2;
    setTimeout(() => {
      element.style.opacity = 1; // Ensure initial opacity
      element.style.transition = `opacity ${fadeEffectTime}s ease-in`;
      element.style.opacity = 0;
      setTimeout(() => { // the actual transition will take fadeEffectTime to complete, wait for then
        element.remove();
      }, fadeEffectTime * 1000);
    }, seconds * 1000);
}