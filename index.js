'use strict'

const config = require("./config/config.js");
const Bluebird = require("bluebird");
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const co = Bluebird.coroutine;

const google = require("./services/googleSpeech")();
const apiai = require("./services/apiai")();
// const luis = require("./services/luis")();

app.set('port', config.port)

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
	if (req.query['hub.verify_token'] === config.facebook.verifyToken) {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
	co(function* () {
		res.sendStatus(200); // Temporary!!!
		const body = req.body;
		if (body.object == "page") {
			for (let entry of body.entry) {
				for (let event of entry.messaging) {
					yield processEvent(event);
				}
			}
		}
	})().catch(err => console.error(err));
});


function processEvent(event) {
	return co(function* () {

		let sender = event.sender;
		let text = (event.message || {}).text;
		const attachments = (event.message || {}).attachments;

		// if audio attachments => try to recognize
		if (attachments) {
			const attachment = attachments[0];
			if (attachment.type === "audio") {
				const url = attachment.payload.url;
				text = yield google.recognizeAudioByUrl(url);
				yield sendTextMessage(sender, `[speech] ${text}`)
			}
		} else if (text) {

			const apiaiRes = yield apiai.recognize(text);
			yield sendTextMessage(sender, apiai.getSummary(apiaiRes));

			// const luisRes = yield luis.recognize(text);
			// yield sendTextMessage(sender, luis.getSummary(luisRes));

		} else {
			yield sendTextMessage(sender, "Sorry?")
		}
	})();
}

function sendTextMessage(sender, text) {
	return new Promise((resolve, reject) => {

		let messageData = { text: text };
		
		request({
			url: 'https://graph.facebook.com/v2.6/me/messages',
			qs: { access_token: config.facebook.pageAccessToken },
			method: 'POST',
			json: {
				recipient: { id: sender.id },
				message: messageData,
			}
		}, function(error, response, body) {
			if (error) {
				return reject(error);
			} else if (response.body.error) {
				return reject(response.body.error);
			}
			resolve();
		});
	});
}

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})
