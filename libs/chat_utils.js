"use strict";
const request = require("request");

const ProjectStorage = require('../storages/project')

class ChatUtils{
    constructor(){
        this.projectStorage = new ProjectStorage();
        this.project = this.projectStorage.read();
    }

    log(message, title, content, link){
        return new Promise((resolve, reject) => {
            var options = {
                method: 'POST',
                url: this.project.chat_channel,
                body:
                {
                    text: message,
                    attachments:
                    [
                        {
                            title: title,
                            title_link: link,
                            text: content,
                            // image_url: 'https://rocket.chat/images/mockup.png',
                            color: '#764FA5'
                        }
                    ]
                },
                json: true
            };

            request(options, function (error, response, body) {
                if (error){
                    reject(error);
                    return;
                }
                resolve(body);
            });
        });
    }

    feedback(message, title, content){
        return new Promise((resolve, reject) => {
            var options = {
                method: 'POST',
                url: "https://chat.ows.vn/hooks/mgJ2wcSvnrpNeg4R4/h2kaaHAag3k2WWq5EiWZGbszne28hCFdjoJ75cFKQjXdL9aS",
                body:
                {
                    text: message,
                    attachments:
                    [
                        {
                            title: title,
                            title_link: "http://redmine.ows.vn/projects/ows-dev-flow-tool",
                            text: content,
                            // image_url: 'https://rocket.chat/images/mockup.png',
                            color: '#764FA5'
                        }
                    ]
                },
                json: true
            };

            request(options, function (error, response, body) {
                if (error){
                    reject(error);
                    return;
                }
                resolve(body);
            });
        });
    }
}

module.exports = ChatUtils;