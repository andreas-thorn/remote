const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer;

mainWindow = remote.getCurrentWindow();

// Synchronous message, will print pong
//console.log(ipc.sendSync('synchronous-message', 'ping'))

function getCurrentChannel(){
    ipc.send("get-current-channel")
}

function getCurrentSource(){
    ipc.send("get-current-source")
}

function getSources()
{
    ipc.send("get-sources")
}

ipc.on("get-sources-reply", (event, hello) => {
    var sources= JSON.parse(hello);
    var select = document.getElementById("selector");

    for (const [key, name] of Object.entries(sources)) {
        var el = document.createElement("option");
        el.textContent = name.name
        el.value = key
        select.appendChild(el);
    }

    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, {});
   
})

document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, {});

    ipc.send("get-sources")
    ipc.send("get-current-sources")
    ipc.send('get-all-channel-data')
  });

function sourceUpdated(){
    var e = document.getElementById("selector");
    var source = e.options[e.selectedIndex].value;
    console.log(`Source changed to ${source}`)

    ipc.send("change_source", source)
}

function channelUp(){
    ipc.send("channelUp")
}

function channelDown(){
    ipc.send("channelDown")
}

function increaseVolume(){
    ipc.send("increaseVolume")
}

function decreaseVolume(){
    ipc.send("decreaseVolume")
}

function standby(){
    ipc.send("standby")
}

ipc.on('get-current-channel-response', (event, current_channel) => {
    document.getElementById("current_channel").innerText = current_channel;
})

ipc.on('tv-disconnected', (event) => {
    document.getElementById('status-nav').className = "nav-wrapper red";
})

ipc.on('tv-connected', (event) => {
    document.getElementById('status-nav').className = "nav-wrapper green";
})