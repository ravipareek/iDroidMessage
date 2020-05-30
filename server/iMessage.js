const imessage = require('osa-imessage')
const osa = require('node-osascript')
const firebase = require("firebase");
var emoji = require('node-emoji')
const fcm = require('fcm-notification')
const serverKey = require("./idroidmessage-firebase-adminsdk-cj4bk-5987e29cef.json");
const path = require('path')
var Queue = require('bull');
const { setQueues } = require('bull-board')
const express = require('express')
var cors = require('cors')
const app = require('express')()
const { UI } = require('bull-board')
const expressSwagger = require('express-swagger-generator')(app);

var token = ""
var database = ""

var FCM = new fcm(serverKey)


var sendQueue = new Queue('send')
var receiveQueue = new Queue('receive')
var writingQueue = new Queue('writing')

var mainQueue = new Queue('main')
setQueues([mainQueue])


mainQueue.process(function (job, done){
	var queueData = job.data
	switch (queueData.type){
		case 'send':
			console.log(queueData['message'])
			// queueData['message'] = emoji.emojify(emoji.unemojify(queueData['message']))
			// console.log(queueData['message'])
			imessage.handleForName(queueData['user']).then(user =>{
				imessage.send(user, queueData['message']).then(()=>{
					job.progress(100)
					done()
				}).catch(err=>{
					command = 'tell application "Messages" to activate\ntell application "System Events"\nkeystroke "n" using {command down}\ndelay 1\nkeystroke "' + queueData['user'] + '" & return\ndelay 1\nkeystroke "' + queueData['message'] + '" & return\nend tell'
					console.log('Need to start new conversation')
					osa.execute(command, function(err, result, raw){
						if (err) {
							console.log(err)
							done(new Error("Error starting new conversation with " + queueData['user']))
						}
						else{
							job.progress(100)
							done()
						}
					})
				})
			}).catch(() =>{
				command = 'tell application "Messages" to activate\ntell application "System Events"\nkeystroke "n" using {command down}\ndelay 1\nkeystroke "' + queueData['user'] + '" & return\ndelay 1\nkeystroke "' + queueData['message'] + '" & return\nend tell'
				console.log('Need to start new conversation')
				osa.execute(command, function(err, result, raw){
					if (err) {
						console.log(err)
						done(new Error("Error starting new conversation with " + queueData['user']))
					}
					else{
						job.progress(100)
						done()
					}
				})
			})
			break
		case 'receive':
			var msg = queueData
			msg.text = new String(msg.text)
			if (msg.text.includes(String.fromCharCode(8220) || String.fromCharCode(8221))){
				var re = new RegExp("[" + String.fromCharCode(8220) + "|" + String.fromCharCode(8221) + "]",'g')
				msg.text = String(msg.text).replace(re,'\"')
				// console.log("Replaced \"")
			}
			if (msg.text.includes(String.fromCharCode(8216) || String.fromCharCode(8217))){
				var re = new RegExp("[" + String.fromCharCode(8216) + "|" + String.fromCharCode(8217) + "]",'g')
				msg.text = String(msg.text).replace(re,"\'")
				console.log("Replaced \'")
			}
			if (msg.text.includes(String.fromCharCode(8217))){
				var re = new RegExp(String.fromCharCode(8217),'g')
				msg.text = String(msg.text).replace(re,"\'")
				console.log("Replaced \'")
			}
			// send push notification
			if(token != ""){
				var message = {
		        data: {
		            user: String(msg.handle),
		            message: encodeText(String(msg.text)),
		            rawMsg: String(msg.text)
		        },
		        token : token
		        };
		        // console.log(message.data.rawMsg)

		        FCM.send(message, function(err, response) {
				    if(err){
				        done(new Error('Sending Error: ' + err))
				    }else {
				        // console.log('response here', response);
				    }
				})
				job.progress(100)
				done()
			}
			else{
				done(new Error('Token not found'))
			}
			break
		case 'writing':
			command = 'tell application "Messages" to activate\ntell application "System Events"\nkeystroke "n" using {command down}\ndelay 1\nkeystroke "' + queueData.user + '" & return\ndelay 1\nkeystroke "typing"\ndelay 2\nkeystroke "w" using {command down, shift down}\nend tell'
			osa.execute(command, function(err, result, raw){
				if (err){
					console.log(err)
					done(`Error marking ${queueData.user} as read`)
				}
				else{
					// clearTimeout(timer)
					console.log('Writing to ' + queueData.user)
					job.progress(100)
					done()
				}
			})
			break
	}
})



// sendQueue.process(function (job, done) {
// 	var data = job.data
// 	imessage.handleForName(data['user']).then(user =>{
// 		imessage.send(user, data['message']).then(()=>{
// 			job.progress(100)
// 			done()
// 		}).catch(err=>{
// 			startNewConvo(data['user'], data['message'])
// 		})
// 	}).catch(() =>{
// 		console.log('Could not find user')
// 		done(new Error('Could not find user'))
// 	})
// })

// receiveQueue.process(function (job, done) {
// 	var msg = job.data
// 	// send push notification
// 	if(token != ""){
// 		var message = {
//         data: {    //This is only optional, you can send any data
//             user: String(msg.handle),
//             message: String(msg.text)
//         },
//         notification:{
//             body : 'New iMessage'
//         },
//         token : token
//         };

//         // console.log(message)
//         FCM.send(message, function(err, response) {
// 		    if(err){
// 		        done(new Error('Sending Error: ' + err))
// 		    }else {
// 		        job.progress(100)
// 				done()
// 		    }
// 		})
// 	}
// 	else{
// 		done(new Error('Token not found'))
// 	}
// })

// writingQueue.process(function (job, done) {
// 	var user = job.data.user
// 	let result = startWritingIndicator(user)
// 	if (result){
// 		job.progress(100)
// 		done()
// 	}else{
// 		done(`Error marking ${user} as read`)
// 	}
// })

function iMessageListener(){
	var firebaseConfig = {
		apiKey: "AIzaSyCuuTdMMwUyPc84A5zlfQ5uxWLw3vD9NIo",
		authDomain: "idroidmessage.firebaseapp.com",
		databaseURL: "https://idroidmessage.firebaseio.com",
		projectId: "idroidmessage",
		storageBucket: "idroidmessage.appspot.com",
		messagingSenderId: "1070607614750",
		appId: "1:1070607614750:web:ce6daacaa42fc806bd7f0f",
		measurementId: "G-ETCXTS5NK6"
	};
	firebase.initializeApp(firebaseConfig);
	console.log("Database Initialized")
	getPhoneToken()

	console.log("iMessage Listener On")
	imessage.listen(2).on('message', async (msg) => {
	    if (!msg.fromMe) {
	    	// msg.text = msg['text'].encode() 
			msg.text = emoji.unemojify(msg.text)
	    	console.log(`'${msg.text}' from ${msg.handle}`)
	    	msg.type = 'receive'
	    	mainQueue.add(msg)
	    }
	    else{
	    	console.log(`Sent message: '${msg.text}' to ${msg.handle}`)
	    }
	});
}

iMessageListener()

function getPhoneToken(){
	var ref = firebase.database().ref('token')
	ref.on("value", function(snapshot) {
	  token = snapshot.val();
	  console.log("Token: " + token)
	}, function (errorObject) {
	  console.log("The read failed: " + errorObject.code);
	});
}

function startNewConvo(user, message){
	command = 'tell application "Messages" to activate\ntell application "System Events"\nkeystroke "n" using {command down}\ndelay 1\nkeystroke "' + user + '" & return\ndelay 1\nkeystroke "' + message + '" & return\nend tell'
	console.log('Need to start new conversation')
	osa.execute(command, function(err, result, raw){
		if (err) {
			console.log(err)
			return false
		}
		else{
			console.log('Started new conversation with ' + user)
			return true
		}
	})
}

async function readMessage(handle){
	var timer = setTimeout(function(){
	    console.log('kill');
	    this.stdin.pause();
	    this.kill();
	 },8000)
	command = 'tell application "Messages" to activate\ntell application "System Events"\nkeystroke "n" using {command down}\ndelay 1\nkeystroke "' + handle + '" & return\ndelay 1\nkeystroke return\nkeystroke "w" using {command down, shift down}\nend tell'
	osa.execute(command, function(err, result, raw){
		if (err){
			return false
		}
		else{
			clearTimeout(timer)
			console.log('Marked ' + handle + ' read')
			return true
		}
	})
}


function startWritingIndicator(handle){
	command = 'tell application "Messages" to activate\ntell application "System Events"\nkeystroke "n" using {command down}\ndelay 1\nkeystroke "' + handle + '" & return\ndelay 1\nkeystroke "typing"\ndelay 2\nkeystroke "w" using {command down, shift down}\nend tell'
	osa.execute(command, function(err, result, raw){
		if (err){
			console.log(err)
			return false
		}
		else{
			// clearTimeout(timer)
			console.log('Writing to ' + handle)
			return true
		}
	})
}

function decodeText(text){
	return text.replace(/\\u[\dA-F]{4}/gi,
		function (match){
			return String.fromCharCode(parseInt(match.replace(/\\u/g,''),16))
		})
}

function encodeText(theString) {
  var unicodeString = '';
  for (var i=0; i < theString.length; i++) {
    var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
    while (theUnicode.length < 4) {
      theUnicode = '0' + theUnicode;
    }
    theUnicode = '\\u' + theUnicode;
    unicodeString += theUnicode;
  }
  return unicodeString;
}


app.use(express.json())
app.use(cors())

app.use('/queues', UI)
/**
 * @typedef Message
 * @property {string} user.query.required - name of recepient
 * @property {string} message.query.required - message to send
 */

 /**
 * @typedef User
 * @property {string} user.query.required - name of user
 */



/**
 * This function comment is parsed by doctrine
 * @route POST /send
 * @group Send - Send iMessage
 * @param {Message.model} msg.body.required - iMessage
 * @consumes application/json application/xml
 * @returns {string} 200 - Confirmation
 * @returns {Error}  default - Unexpected error
 */
app.post('/send', function(req, res){
	var messageData = req.body
	messageData['type'] = 'send'
	text = messageData['message']
	text = decodeText(text)
	messageData['message'] = text
	mainQueue.add(messageData)
	res.send('Message added to queue')
})

/**
 * This function comment is parsed by doctrine
 * @route POST /markRead
 * @group Mark - Mark Status on iMessage
 * @param {User.model} user.body.required - name of recepient
 * @consumes application/json application/xml
 * @returns {string} 200 - Confirmation
 * @returns {Error}  default - Unexpected error
 */
app.post('/markRead', function(req, res){
	var data = req.body
	res.send("Deprecated")
})

/**
 * This function comment is parsed by doctrine
 * @route POST /markWriting
 * @group Mark - Mark Status on iMessage
 * @param {User.model} user.body.required - name of recepient
 * @consumes application/json application/xml
 * @returns {string} 200 - Confirmation
 * @returns {Error}  default - Unexpected error
 */
app.post('/markWriting', function(req, res){
	var data = req.body
	imessage.handleForName(data['user']).then(user =>{
		mainQueue.add({
			'user': user,
			'type': 'writing'
		})
		res.status(200);
		res.send("Added to writing queue")
	}).catch(err => {
		console.log('Could not find user ' + data.user)
		res.status(500)
		res.send('Failed to start writing')
	})
})


let options = {
    swaggerDefinition: {
        info: {
            description: 'iMessage API for commands',
            title: 'iMessage API',
            version: '1.0.0',
        },
        host: '8942906a.ngrok.io',
        basePath: '/',
        produces: [
            "application/json",
            "application/xml"
        ],
        schemes: ['https']
    },
    basedir: __dirname, //app absolute path
    files: ['./iMessage.js'] //Path to the API handle folder
};
expressSwagger(options)
app.listen(1208, () => console.log(`Example app listening on port ${1208}!`))




/*
function askOutPrema(){
	message = {
		"user" : "Prema Nursimooloo",
		"message": "Will you be my girlfriend?",
		"date": "Monday January 20 2020 19:00:00 (Eastern Standard Time)"
	}
	writeMessageToDB("sent", message)
}
*/
