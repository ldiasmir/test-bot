'use strict';

const request = require("request");
const ffmpeg = require("fluent-ffmpeg");
const tmp = require("tmp");
const fs = require("fs");
const Speech = require("@google-cloud/speech");

const config = require("../config/config");

class GoogleSpeechApiClient {

  constructor(options) {

    // defaults
    this.projectId = "";
    this.credentials = {};
    this.audioFormat = "flac";
    this.audioCodec = "flac"; // it is dumb, but ffmpeg requires codec to be in lower case,
    this.googleEncoding = this.audioCodec.toUpperCase(); // and Google in upper ONLY...
    this.audioChannels = 1;
    this.sampleRate = 16000;
    this.defaultLanguageCode = "en-US";

    // override defaults
    Object.assign(this, options);

    this.client = Speech({
      projectId: this.projectId,
      credentials: this.credentials
    });    
  }

  /**
   * @public
   */
  recognizeAudioByUrl(url, languageCode) {

    return this._getStream(url).then(stream => {

      return new Promise((resolve, reject) => {

        let result = "";

        stream.pipe(this.client.createRecognizeStream({
          config: {
            encoding: this.googleEncoding,
            sampleRate: this.sampleRate,
            languageCode: languageCode || this.defaultLanguageCode
          },
          singleUtterance: false,
          interimResults: false
        }))
        .on("error", err => reject(err))
        .on("data", data => {
          /**
           * Speech API client documentation states that recognozed text passed with data chunk with
           * data.endpointerType === Speech.endpointerTypes.END_OF_AUDIO
           * (See for details: https://www.npmjs.com/package/@google-cloud/speech)
           * In practice it's empty and actual data comes in next data chunk with
           * data.endpointerType === Speech.endpointerTypes.ENDPOINTER_EVENT_UNSPECIFIED (wtf?)
           * Maybe client/API bug. Workaround this by returning the LAST data chunk
           * with data.results defined.
           */

          // if (data && data.endpointerType === Speech.endpointerTypes.END_OF_AUDIO) {
          //   resolve(data.results);
          // }

          if (data && data.results) {
            result = data.results;
          }

        }).on("finish", () => {
          resolve(result);
        });

      });

    });

  }

  _getStream(url) {
    return new Promise((resolve, reject) => {

      tmp.file((err, path) => {

        if (err) { return reject(err); }

        request.get(url)
          .on("error", err => reject(err))
          .pipe(fs.createWriteStream(path))
          .on("finish", () => {

            const encodedStream = ffmpeg(path)
              .format(this.audioFormat)
              .audioCodec(this.audioCodec)
              .audioChannels(this.audioChannels)
              .audioFrequency(this.sampleRate)
              .pipe();

            resolve(encodedStream);
          });
      });

    });
  }

}

module.exports = function Factory () {
  return new GoogleSpeechApiClient({
    projectId: config.google.projectId,
    credentials: config.google.credentials
  }); // Singleton;
};
