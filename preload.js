// Holden Ernest - 1/11/2024
// This has access to both the DOM and electron

const { contextBridge, ipcRenderer } = require("electron");

window.addEventListener('DOMContentLoaded', () => {
    
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) { // replace text with certain ID(chrome-version ect)
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
    ipcRenderer.send('load-last-list'); // auto load the list
});

// IMPORTANT: all connections between main and renderers are done through this
// any channels used in the renderer need to be whitelisted
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            // whitelist channels
            let validChannels = ["attempt-login","load-list"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            } else {
                console.error(`channel '${channel}' is not whitelisted`)
            }
        },
        receive: (channel, func) => {
            let validChannels = ['display-list'];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            } else {
                console.error(`channel '${channel}' is not whitelisted`)
            }
        }
    }
);