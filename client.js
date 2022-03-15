var socket = require('socket.io-client')('http://localhost:8080');
  socket.on('connect', () => {
      console.log('=== start chatting ===')
  })
  