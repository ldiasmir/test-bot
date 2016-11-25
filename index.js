'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

const apiai = require("./services/apiai")();

app.set('port', (process.env.PORT || 5000))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

// index
app.get('/', function (req, res) {
	res.send('hello world i am a secret bot')
})

// for facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === '0JnWimhayLJUarCcho8qo9yZcJoJrsp4euo+S8A6kkQ=') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

// to post data
app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id
		if (event.message && event.message.text) {
			let text = event.message.text
			// if (text === 'Generic') {
			// 	sendGenericMessage(sender)
			// 	continue
			// }

			apiai.recognize(text).then(reply => {
				const message = apiai.getSummary(reply);
				sendTextMessage(sender, message)
			});
		}
		if (event.postback) {
			let text = JSON.stringify(event.postback)
			sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
			continue
		}
	}
	res.sendStatus(200)
})


// recommended to inject access tokens as environmental variables, e.g.
// const token = process.env.PAGE_ACCESS_TOKEN
const token = "EAAIhSZBqtaS0BAKlpzNyw93lIZCA4d7S23m80NtDyCmy6d4DzrZBT9eGh2GH8ZAZBIBWv8sHZAp9JiIvR2N9Ifr6WbageIlQ5gdbtEwJmpdwc2WaXAsXZBZAPdpFx192Md50uO51Qj16fm4mZAvZAqGM5ZCSvc1nJntw8qZCeOG4NMGiBAZDZD"

function sendTextMessage(sender, text) {
	let messageData = { text:text }
	
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
			console.log('Error sending messages: ', error)
		} else if (response.body.error) {
			console.log('Error: ', response.body.error)
		}
	})
}

// function sendGenericMessage(sender) {
// 	let messageData = {
// 		"attachment": {
// 			"type": "template",
// 			"payload": {
// 				"template_type": "generic",
// 				"elements": [{
// 					"title": "First card",
// 					"subtitle": "Element #1 of an hscroll",
// 					"image_url": "http://messengerdemo.parseapp.com/img/rift.png",
// 					"buttons": [{
// 						"type": "web_url",
// 						"url": "https://www.messenger.com",
// 						"title": "web url"
// 					}, {
// 						"type": "postback",
// 						"title": "Postback",
// 						"payload": "Payload for first element in a generic bubble",
// 					}],
// 				}, {
// 					"title": "Second card",
// 					"subtitle": "Element #2 of an hscroll",
// 					"image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
// 					"buttons": [{
// 						"type": "postback",
// 						"title": "Postback",
// 						"payload": "Payload for second element in a generic bubble",
// 					}],
// 				}]
// 			}
// 		}
// 	}
// 	request({
// 		url: 'https://graph.facebook.com/v2.6/me/messages',
// 		qs: {access_token:token},
// 		method: 'POST',
// 		json: {
// 			recipient: {id:sender},
// 			message: messageData,
// 		}
// 	}, function(error, response, body) {
// 		if (error) {
// 			console.log('Error sending messages: ', error)
// 		} else if (response.body.error) {
// 			console.log('Error: ', response.body.error)
// 		}
// 	})
// }

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})
