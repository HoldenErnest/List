// Holden Ernest - 1/11/2024
// This has access to both the DOM and electron

const { contextBridge, ipcRenderer, app } = require("electron");

window.addEventListener('DOMContentLoaded', () => {
    
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }

    replaceText(`install-version`, "1.0.1"); // todo set to app.getVersion();
    ipcRenderer.send('load-last-list'); // auto load the list
    ipcRenderer.send('update-avail-lists');
});

// IMPORTANT: all connections between main and renderers are done through this
// any channels used in the renderer need to be whitelisted
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            // whitelist channels
            let validChannels = ["attempt-login","load-list","get-urls","save-list"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            } else {
                console.error(`channel '${channel}' is not whitelisted`)
            }
        },
        receive: (channel, func) => {
            let validChannels = ['display-list','update-image','recieve-list-names'];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            } else {
                console.error(`channel '${channel}' is not whitelisted`)
            }
        }
    }
);