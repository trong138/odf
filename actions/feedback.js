"use strict";
const co = require('co');
const prompt = require('prompt');
const convertAsync = require('convert-async');
const ChatUtils = require('../libs/chat_utils');
const GlobalStorage = require('../storages/global')

class FinishAction{
    constructor(params){
        this.globalStorage = new GlobalStorage();
        this.auth = this.globalStorage.read();
        this.chat_utils = new ChatUtils();
    }

    do(resolve, reject){
        co((function* () {
            "use strict";

            var comment_input = (yield convertAsync(prompt, prompt.get, [['comment']])).comment; 

            yield this.chat_utils.feedback("Feedback", `User @${this.auth.redmine_user_login}`, comment_input);

            return "Sent";
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports = FinishAction;