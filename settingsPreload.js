// Holden Ernest - 10/26/2024
// login preloader :o

const { contextBridge, ipcRenderer, app } = require("electron");

window.addEventListener('DOMContentLoaded', (event) => {
    
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }

    replaceText(`install-version`, "1.3.0"); // TODO: set to app.getVersion();
});

// IMPORTANT: all connections between main and renderers are done through this
// any channels used in the renderer need to be whitelisted
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            // whitelist channels
            let validChannels = ["attempt-login"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            } else {
                console.error(`channel '${channel}' is not whitelisted`)
            }
        },
        receive: (channel, func) => {
            let validChannels = ['send-notification'];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            } else {
                console.error(`channel '${channel}' is not whitelisted`)
            }
        }
    }
);