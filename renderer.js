'use strict';

const remote = require('electron').remote;
const APIHandler = require('./api_handler.js');

let mainWindow = remote.getCurrentWindow();
let channelData = new Map();
let apiHandler = new APIHandler();
var connectionTester;


var connectionStatus = {
    connectedInternal: null,
    connectedListener: function(val) {},
    set connected(value) {
        if (this.connectedInternal !== value){
            this.connectedInternal = value;
            this.connectedListener(value);
        }
    },
    get connected() {
      return this.connectedInternal;
    },
    registerListener: function(listener) {
      this.connectedListener = listener;
    }
};

connectionStatus.registerListener(function(val) {
    if(val){
        M.toast({html: 'Connection established'});
        clearInterval(connectionTester);
        populateSourceOptions();
        setSelectedSourceItem();
    }
    else{
        M.toast({html: 'TV not accessible'});
        connectionTester = setInterval(testConnection, 3000);
    }
});

function testConnection(){
    console.log("Testing connection")
    sendRequest('/1/system');
}

document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, {});

    populateSourceOptions();
    populateChannelMap();
    setSelectedSourceItem();
    
});

function sourceSelect(){
    var e = document.getElementById('selector');
    var source = {'id': e.options[e.selectedIndex].value};
    console.log(`Source changed to ${source}`);

    sendCommand(source, '/1/sources/current');
}

async function setSelectedSourceItem(){
    var currentSource = await sendRequest('/1/sources/current');

    if(typeof(currentSource) === 'undefined'){
        console.log('Could not set selected source item');
        return;
    }

    var e = document.getElementById('selector');
    e.value = JSON.parse(currentSource).id;

    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, {});
}

async function populateSourceOptions(){
    console.log('Fetching all sources');

    var sources = await sendRequest('/1/sources');
    if(typeof(sources) === 'undefined'){
        console.log('Could not populate source list.');
        return;
    }

    var sources= JSON.parse(sources);
    var select = document.getElementById('selector');

    for (const [key, name] of Object.entries(sources)) {
        var el = document.createElement('option');
        el.textContent = name.name;
        el.value = key;
        select.appendChild(el);
    }

    var elems = document.querySelectorAll('select');
    var instances = M.FormSelect.init(elems, {});
}

async function populateChannelMap(){
    console.log('Fetching channel list');

    var channelList = await sendRequest('/1/channels');
    if(typeof(channelList) === 'undefined'){
        console.log('Could not get channel list.');
        return;
    }

    channelList = JSON.parse(channelList);

    for(const [key, channel] of Object.entries(channelList)){
        channelData[key] = (channel.name? channel.name.trim() : channel.present) + `(${channel.preset})`;
    }
}

async function sendRequest(path){
    try{
        var response = await apiHandler.getCommand(path);
        connectionStatus.connected = true;
        return response;
    }
    catch(error){
        console.log('Something went wrong: ' + error);
        console.log(error.stack);
        connectionStatus.connected = false;
        return undefined;
    }
}

async function sendCommand(payload, path = '/1/input/key'){
    try{
        var response = await apiHandler.postCommand(path, payload);
        connectionStatus.connected = true;
        console.log(response);
    }
    catch(error){
        console.log('Something went wrong: ' + error);
        console.trace();
        connectionStatus.connected = false;
        return undefined;
    }
}