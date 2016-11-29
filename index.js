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
	} else {
		res.send('Error, wrong token')
	}
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

		let text = (event.message || {}).text;
		const attachments = (event.message || {}).attachments;

		let reply = "Sorry?";

		// if audio attachments => try to recognize
		if (attachments) {

			const attachment = attachments[0];
			if (attachment.type === "audio") {
				const googleRes = yield google.recognizeAudioByUrl(attachment.payload.url);
				reply = google.getSummary(googleRes);
			}

		} else if (text) {

			const sessionId = event.sender.id; // use FB page-scoped user ID as sessionId for api.ai
			const apiaiRes = yield apiai.recognize(sessionId, text);
			reply = apiai.getSummary(apiaiRes);

		}

		yield sendTextMessage(event.sender, reply);

	})();
}

function sendTextMessage(sender, text) {

	return co(function* () {

		const FB_MAX_MESSAGE_LENGTH = 200;

		if (text.length > FB_MAX_MESSAGE_LENGTH) {

			const chunks = text.match(new RegExp(`.{1,${FB_MAX_MESSAGE_LENGTH}}`, "g"));
			for (let chunk of chunks) {
				yield _send(chunk);
			}

		} else {
			yield _send(text);
		}

	})();

	function _send(text) {
		return new Promise((resolve, reject) => {
			request({
				url: 'https://graph.facebook.com/v2.6/me/messages',
				qs: { access_token: config.facebook.pageAccessToken },
				method: 'POST',
				json: {
					recipient: { id: sender.id },
					message: { text: text },
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

}

// spin spin sugar
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})
