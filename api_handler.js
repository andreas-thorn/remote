'use strict';

const hostName = '192.168.0.5'
const hostPort = 1925

class APIHandler {
  async postCommand(path = '', data = {}) {
    console.log(`Sending POST to ${path} with payload ${(JSON.stringify(data))}`)

    var url = 'http://' + hostName + ':' + hostPort + path;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify(data)
    });

    return await response;
  }

  async getCommand(path = '', data = {}){
    console.log(`Sending GET to ${path}`)

    var url = 'http://' + hostName + ':' + hostPort + path;

    var response = await fetch(url);
    response = await response.json();
    return JSON.stringify(response);
  }
}

module.exports = APIHandler;