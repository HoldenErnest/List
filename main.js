const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const createWindow = () => { // function to make the window
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
          }
    })
    win.loadFile('index.html')
}

app.whenReady().then(() => { // Start the application
    createWindow()
    app.on('activate', () => { // allow event listener after the window is created
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => { // CLOSE THE APP
    if (process.platform !== 'darwin') app.quit()
})