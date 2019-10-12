const { app, BrowserWindow, net } = require('electron');
const ipc = require('electron').ipcMain;
const EventEmitter = require('events');

let win
// Map to locally store all channel information (id, name, preset).
let channel_data = new Map()
// Event emitter used to notify when connection is lost or established.
const statusEmitter = new EventEmitter();
// Bool to indicate current connection status.
var connectionStatus;

const hostName = '192.168.0.5'
const hostPort = 1925

function postCommand(path = undefined, payload, callback){
  console.log(`Sending POST to ${path} with payload ${(payload)}`)

  const request = net.request({
    method: 'POST',
    protocol: 'http:',
    hostname: hostName,
    port: hostPort,
    path: path,
  })
  
  request.on('error', (event, error) => {
    console.log(`Something went wrong.`)

    // Emit event if connection was lost.
    if(connectionStatus || typeof connectionStatus === 'undefined'){
      statusEmitter.emit('disconnected');
      connectionStatus = false;
    }
  })

  var response_message; 
  request.on('response', (response) => {
    console.log(`Received response: ${response.statusCode} ${response.statusMessage} for ${path}`)
    response.on('data', (data_chunk) => {
      response_message = data_chunk;

      // Emit event if connection was (re)established.
      if(!connectionStatus){
        connectionStatus = true
        statusEmitter.emit('connected')
      }
    })

    response.on('end', () => {
      console.log(typeof(callback))
      if (callback){
        console.log("Got response, running callback")
        callback(response_message)
      }
      else{
        console.log("No callback function in argument")
      }
    })
   
  })

  request.write(payload)
  request.end()
}

function getCommand(path, callback){
  console.log(`Sending GET to ${path}`)

  const request = net.request({
    method: 'GET',
    protocol: 'http:',
    hostname: hostName,
    port: hostPort,
    path: path,
  })

  var response_message; 

  request.on('error', (event, error) => {
    console.log(`Something went wrong.`)

    // Emit event if connection was lost.
    if(connectionStatus || typeof connectionStatus === 'undefined'){
      statusEmitter.emit('disconnected');
      connectionStatus = false;
    }
  })

  request.on('response', (response) => {
    console.log(`Received response: ${response.statusCode} ${response.statusMessage} for ${path}`)
    response.on('data', (data_chunk) => {
      response_message = data_chunk;

      // Emit event if connection was (re)established.
      if(!connectionStatus){
        connectionStatus = true
        statusEmitter.emit('connected')
      }
    })

    response.on('end', () => {
      if (callback){
        callback(response_message)
      }
      else{
        console.log("No callback function in argument")
      }
    })
  })

  request.end()
}

ipc.on('get-all-channel-data', (event, arg) => {
  getCommand('/1/channels', (response_data) => {
    channel_info = JSON.parse(response_data)
    for (const [key, channel] of Object.entries(channel_info)) {
      channel_data[key] = (channel.name? channel.name.trim() : channel.preset) + `(${channel.preset})`
    }
  })
})

ipc.on('get-current-channel', (event, arg) => {
  getCommand('/1/channels/current', (response_data) => {
    response_data_json = (JSON.parse(response_data))
    if(channel_data){
      console.log(channel_data[response_data_json.id])
      event.reply('get-current-channel-response', channel_data[response_data_json.id])
    }
    else{
      console.log("Channel data not received")
    }
  })
})

ipc.on('get-current-source', (event, arg) => {
  getCommand('/1/sources/current', (response_data) => {
    response_data_json = (JSON.parse(response_data))
    event.reply('get-current-source-reply', response_data_json)
  })
})

ipc.on('get-sources', (event, arg) => {
  getCommand('/1/sources', (response_data) => {
    event.reply('get-sources-reply', JSON.stringify(JSON.parse(response_data)))
  })
})

ipc.on("standby", (event, command) => {
  var payload = JSON.stringify({"key": "Standby"})
  postCommand('/1/input/key', payload)
})

ipc.on('decreaseVolume', (event, command) => {
  var payload = JSON.stringify({"key": "VolumeDown"})
  postCommand('/1/input/key', payload)
})

ipc.on('increaseVolume', (event, command) => {
  var payload = JSON.stringify({"key": "VolumeUp"})
  postCommand('/1/input/key', payload)
})

ipc.on('channelDown', (event, command) => {
  var payload = JSON.stringify({"key": "ChannelStepDown"})
  postCommand('/1/input/key', payload, updateCurrentChannel)
})

ipc.on('channelUp', (event, command) => {
  var payload = JSON.stringify({"key": "ChannelStepUp"})
  postCommand('/1/input/key', payload, updateCurrentChannel)
})

ipc.on('change_source', (event, selected_source) => {
  var payload = JSON.stringify({"id": selected_source})
  postCommand('/1/sources/current', payload)
})

function updateCurrentChannel(){
  getCommand('/1/channels/current', (response_data) => {
    response_data_json = (JSON.parse(response_data))
    if(channel_data){
      console.log(`updateCurrentChannel: ${(channel_data[response_data_json.id])}`)
      console.log(channel_data)
      console.log(response_data_json)
    }
    else{
      console.log("Channel data not received")
    }
  })
}

function createWindow () {
  // Create the browser window.
  let win = new BrowserWindow({
    width: 400,
    height: 550,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.setResizable(false)
  win.loadFile('index.html')

  statusEmitter.on('disconnected', () => {
    win.webContents.send('tv-disconnected')
  });

  statusEmitter.on('connected', () => {
    win.webContents.send('tv-connected')
  });

  //win.webContents.openDevTools()
  
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('win-msg', 'whoooooooh!')
  })
  win.on('closed', () => {
      win = null;
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit()
  
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow()
    }
  })

app.on('ready', createWindow)

// Sync messaging
ipc.on('synchronous-message', (event, arg) => {
  event.returnValue = "pong"
})

ipc.on('test-func', (event, command) => {
  getCommand('sources', function(response, command) {
    event.reply('test-function', response)
  })
})
