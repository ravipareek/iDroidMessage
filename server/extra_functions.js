const osa = require('node-osascript')

function readMessage(handle){
	// var timer = setTimeout(function(){
	//     console.log('kill');
	//     this.stdin.pause();
	//     this.kill();
	//  },8000)
	console.log('Read message to ' + handle)
	osa.execute('tell application "Messages" to activate\ntell application "System Events"\nkeystroke "n" using {command down}\nkeystroke username & return\ndelay 2\nkeystroke return\nkeystroke "w" using {command down, shift down}\nend tell', {username: handle}, function(err, result, raw){
		// if (err == null)
		// 	clearTimeout(timer)
	})
}


function startWritingIndicator(handle){
	var timer = setTimeout(function(){
	    console.log('kill');
	    this.stdin.pause();
	    this.kill();
	 },8000)
	osa.execute('tell application "Messages" to activate\ntell application "System Events"\nkeystroke "n" using {command down}\nkeystroke username & return\ndelay 2\nkeystroke "typing"\ndelay 2\nkeystroke "w" using {command down, shift down}\nend tell', {username: handle}, function(err, result, raw){
		if (!err)
			clearTimeout(timer)
	})
}


module.exports = {
	readMessage,
	startWritingIndicator
}

readMessage('+16479953199')