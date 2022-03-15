var app = require('express')();
var querystring = require('querystring');
var http = require('http');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser')

server.listen(8080, function() {
    console.log('Socket server is running.');
});

var onlineUsers=new Map();
io.on('connection', function(socket) {
    console.log("Connected");
    var handshakeData = socket.request;
    onlineUsers.set(socket.id,handshakeData._query['user_id']);
    //Save online status to database
    // saveData(handshakeData,'test_video_upload');
    socket.join("Online");

    socket.on("call status",(data)=>{
        //Save status for call option
        // saveData(data,'test_video_upload');
        if(data.status==1){
            socket.join("CallExpert:"+data.user_id);
        }else{
            socket.leave("CallExpert:"+data.user_id);
        }
        io.to("Online").emit("call status changed",data);

    });

    socket.on("chat status",(data)=>{
        //Save status for chat option
        // saveData(data,'test_video_upload');
        if(data.status==1){
            socket.join("ChatExpert:"+data.user_id);
        }else{
            socket.leave("ChatExpert:"+data.user_id);
        }
        io.to("Online").emit("chat status changed",data);
    });


    socket.on("call expert",(data)=>{
        //save call data
        // saveData(data,'test_video_upload');
        socket.join("CallRequest:"+data.user_id);
        io.to("CallExpert:"+data.expert_id).emit("incomming call",data);
    });

    socket.on("call response",(data)=>{
        //update call response data
        // saveData(data,'test_video_upload');
        // if(data.status=="ACCEPTED"){
        //     //Call Accepted
        // }else{
        //     //Call rejected
        // }
        io.to("CallRequest:"+data.user_id).emit("call responded",data);
        
    });

    socket.on("enter chat room",(data)=>{
        socket.join("ChatRoom");
    });

    socket.on("leave chat room",(data)=>{
        socket.leave("ChatRoom");
    });

    socket.on("send request to chat room",(data)=>{
        //Save the request data
        // saveData(data,'test_video_upload');
        io.to("ChatRoom").emit("chat request",data);
    });

    socket.on("accept request",(data)=>{
        //Save the request data
        // saveData(data,'test_video_upload');
        io.to("ChatRoom").emit("request accepted",data);
    });

    socket.on("open chat",(data)=>{
        socket.join(data.user_id);
    });

    socket.on("leave chat",(data)=>{
        socket.leave(data.user_id);
    });

    socket.on("send message",(data)=>{
        //save message to database
        // saveData(data,'test_video_upload');
        const senderId=data.sender_id;
        const receiverId=data.receiver_id;

        io.to(receiverId).emit("message received",data);
    });


    socket.on("disconnect", async () => {
        const userId=onlineUsers.get(socket.id);
        if(onlineUsers.has(socket.id))
        onlineUsers.delete(socket.id);

        socket.leave("CallRequest:"+userId);
        socket.leave("CallExpert:"+userId);
        socket.leave("ChatExpert:"+userId);

        console.log("Disconnected");

        //Save offline status to database (Online, Call, Message)
        // saveData(null,'test_video_upload');
      });
})


function saveData(data,end_point) {
  var post_data=querystring.stringify(data);
  var post_options = {
      host: 'maxtambola.com',
      port: '80',
      path: '/api/'+end_point,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      }
  };

  var post_req = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        //   console.log('Response: ' + chunk);
      });
  });

  post_req.write(post_data);
  post_req.end();
}
