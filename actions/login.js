"use strict";
const prompt = require('prompt');
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const co = require('co');
const ProjectStorage = require('../storages/project')

class InitAction {
    constructor(params) {
        this.ProjectStorage = new ProjectStorage();
    }

    do(resolve, reject) {
        console.log("Goto https://redmine.ows.vn/my/account to get your accesskey.");
        console.log("Goto https://git.ows.vn/profile/personal_access_tokens to get gitlab token");
        prompt.start();

        co((function* () {
            var result = {};
            var redmine_host = [
                'https://redmine.ows.vn'
            ];
            var git_host = [
                'https://git.ows.vn'
            ]

            // select redmine_host
            console.log("*************************************************************")
            for (var i = 0; i < redmine_host.length; i++) {
                console.log("Redmine %s: %s", i, redmine_host[i]);
            }
            console.log("****************Select redmine_host id in above*******************")
            var redmine_host_id = 0;
            while (true) {
                redmine_host_id = parseInt((yield convertAsync(prompt, prompt.get, [['redmine_host_id']])).redmine_host_id);
                if (redmine_host_id >= 0 && redmine_host_id < redmine_host.length) {
                    break;
                }
            }
            result.redmine_host = redmine_host[redmine_host_id];
            //select git_host
            console.log("*************************************************************")
            for (var i = 0; i < git_host.length; i++) {
                console.log("Git %s: %s", i, git_host[i]);
            }
            console.log("****************Select git_host id in above*******************")
            var git_host_id = 0;
            while (true) {
                git_host_id = parseInt((yield convertAsync(prompt, prompt.get, [['git_host_id']])).git_host_id);
                if (git_host_id >= 0 || git_host_id < redmine_host.length) {
                    break;
                }
            }
            result.git_host = git_host[git_host_id];
            // insert redmine_apikey
            result.redmine_apikey = "";
            while (true) {
                result.redmine_apikey = (yield convertAsync(prompt, prompt.get, [['redmine_apikey']])).redmine_apikey;
                if (result.redmine_apikey == "") {
                    continue;
                }
                break;
            }
            // insert git_token
            result.git_token = "";
            while (true) {
                result.git_token = (yield convertAsync(prompt, prompt.get, [['git_token']])).git_token;
                if (result.git_token == "") {
                    continue;
                }
                break;
            }

            console.log('result', result);

            this.redmine = new Redmine(result.redmine_host, {
                apiKey: result.redmine_apikey
            });
            "use strict";
            let me = yield this.getRedmineMe();

            result.redmine_user_id = me.user.id;
            result.redmine_user_login = me.user.login;
            result.redmine_user_email = me.user.email;

            this.ProjectStorage.write({ login: result });

            return "Saved";

        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }

    getProjectInfo(project_id) {
        return convertAsync(this.redmine, this.redmine.get_project_by_id, [project_id, {}]);
    }

    getRedmineMe() {
        return convertAsync(this.redmine, this.redmine.current_user, [{ include: 'memberships' }]);
    }
}

module.exports = InitAction;