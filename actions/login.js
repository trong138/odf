"use strict";
const prompt = require('prompt');
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const co = require('co');
const input_data = [
    'redmine_apikey',
    'gitlab_token'
];

const GlobalStorage = require('../storages/global')

class InitAction {
    constructor(params) {
        this.globalStorage = new GlobalStorage();
    }

    do(resolve, reject) {
        console.log("Goto https://redmine.ows.vn/my/account to get your accesskey.");
        console.log("Goto https://git.ows.vn/profile/personal_access_tokens to get gitlab token");
        prompt.start();
        prompt.get(input_data, (err, result) => {
            console.log('result', result);
            // result.redmine_host = 'https://redmine.ows.vn';
            // result.gitlab_host = 'https://git.ows.vn';
            var redmine_host = [
                'https://redmine.ows.vn'
            ];
            var git_host = [
                'https://git.ows.vn'
            ]

            co((function* () {
                // select redmine_host
                console.log("*************************************************************")
                for (var i = 0; i < redmine_host.length; i++) {
                    console.log("Redmine %s: %s", i, redmine_host[i]);
                }
                console.log("****************Select redmine_host id in above*******************")
                var redmine_host_id = 0;
                while (true) {
                    redmine_host_id = parseInt((yield convertAsync(prompt, prompt.get, [['redmine_host_id']])).redmine_host_id);
                    if (redmine_host_id < 0 || redmine_host_id >= redmine_host.length) {
                        continue;
                    }
                    break;
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
                    if (git_host_id < 0 || git_host_id >= redmine_host.length) {
                        continue;
                    }
                    break;
                }
                result.git_host = git_host[git_host_id];


                this.redmine = new Redmine(result.redmine_host, {
                    apiKey: result.redmine_apikey
                });
                "use strict";
                let me = yield this.getRedmineMe();

                result.redmine_user_id = me.user.id;
                result.redmine_user_login = me.user.login;
                result.redmine_user_email = me.user.email;


                this.globalStorage.write(result);

                return "Saved";
            }).bind(this)).then(function (value) {
                resolve(value);
            }, function (err) {
                reject(err);
            });
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