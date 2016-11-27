'use strict';

const request = require('request');

const config = require('../config/config');

class LUISClient {

  /**
   * A simple client for LUIS
   */
  constructor(options) {

    // defaults
    this.appId = "";
    this.subscriptionKey = "";
    this.timezoneOffset = 0; // TODO: get this from user info (how?)
    this.verbose = true;

    // override defaults
    Object.assign(this, options);
  }

  /**
   * Send user input to LUIS for processing
   * @public
   * @returns {Object}
   */
  recognize(userInput) {
    
    return new Promise((resolve, reject) => {
      request({
        uri: `https://api.projectoxford.ai/luis/v2.0/apps/${ this.appId }`,
        qs: {
          "subscription-key": this.subscriptionKey,
          timezoneOffset: this.timezoneOffset,
          verbose: this.verbose,
          q: userInput
        },
        method: "GET",
        json: true
      }, function (error, response, body) {
        if (error) {
          return reject();
        }
        if (response.statusCode !== 200) {
          return reject(new Error(`Service returned unexpected status code: ${ response.statusCode }`));
        }
        resolve(body);
      });
    });

  }

  getSummary(reply) {
    const entities = (reply.entities || []).map(e => `${e.entity} (${e.type})`).join(",") || "None";
    const summary = `[luis] intent: ${reply.topScoringIntent.intent} (${reply.topScoringIntent.score}); entities: ${entities}`;
    return summary;
  }
}

module.exports = function Factory () {
  return new LUISClient({
    appId: config.luis.appId,
    subscriptionKey: config.luis.subscriptionKey
  }); // Singleton;
}
