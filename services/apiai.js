'use strict';

const ApiAi = require("apiai");

class ApiAiClient {

  /**
   * A simple client for ApiAi
   */
  constructor(options) {

    // defaults
    this.clientToken = "";

    // override defaults
    Object.assign(this, options);

    this.client = ApiAi(this.clientToken);
  }

  /**
   * Send user input to ApiAi for processing
   * @public
   * @returns {Object}
   */
  recognize(userInput) {
    
    return new Promise((resolve, reject) => {
      var request = this.client.textRequest(userInput, {
        sessionId: 'dummy'
      });
      request.on("response", response => {
        if (response.status.code !== 200 || response.status.errorType !== "success") {
          return reject(new Error(`api.ai call failed with status code: ${response.status.code}, errorType: ${response.status.errorType}`));
        }
        if (!response.result) {
          return reject(new Error("api.ai returned empty result object"));
        }
        resolve(response.result);
      });
      request.on("error", error => reject(error));
      request.end();
    });

  }

  getSummary(reply) {
    const parameters = JSON.stringify(reply.parameters);
    const summary = `${reply.fulfillment.speech} (intent: ${reply.action}, parameters: ${parameters})`;
    return summary;
  }
    
}

module.exports = function Factory () {
  return new ApiAiClient({
    clientToken: "80612ce5b58d4f89a2194d87162643b1"
  }); // Singleton;
};
