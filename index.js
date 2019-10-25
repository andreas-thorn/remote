"use strict";

const { app, BrowserWindow } = require('electron');

let win

function createWindow () {
  let win = new BrowserWindow({
    width: 400,
    height: 550,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.setResizable(false)
  win.loadFile('index.html')

  //win.webContents.openDevTools()

  win.on('closed', () => {
      win = null;
  })
}

app.on('window-all-closed', () => {
    app.quit()
  
})

app.on('activate', () => {
    if (win === null) {
      createWindow()
    }
  })

app.on('ready', createWindow)