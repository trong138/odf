"use strict";
const child_process = require('child_process');
const prompt = require('prompt');
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const co = require('co');
const input_data = [
    '',
    'gitlab_project'
];

const GlobalStorage = require('../storages/global')
const ProjectStorage = require('../storages/project')
const GitLabUtils = require('../libs/gitlab_utils');
const ChatUtils = require('../libs/chat_utils');

class InitAction {
    constructor(params) {
        this.globalStorage = new GlobalStorage();
        this.projectStorage = new ProjectStorage();
        // this.auth = this.globalStorage.read();
        this.git_utils = new GitLabUtils();
    }

    do(resolve, reject) {
        console.log("Goto https://redmine.ows.vn/my/account to get your accesskey.");
        console.log("Goto https://git.ows.vn/profile/personal_access_tokens to get gitlab token");
        prompt.start();
        co((function* () {
            "use strict";
            var result = {};
            var redmine_host = [
                'https://redmine.ows.vn'
            ];
            var git_host = [
                'https://git.ows.vn',
                'https://api.github.com/'
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


            this.redmine = new Redmine(result.redmine_host, {
                apiKey: result.redmine_apikey
            });

            // identify project
            result.redmine_project_identifier = (yield convertAsync(prompt, prompt.get, [['redmine_project_identifier']])).redmine_project_identifier;
            let me = yield this.getRedmineMe();
            let project = yield this.getProjectInfo(result.redmine_project_identifier);
            var memberships = me.user.memberships.filter((membership) => {
                return membership.project.id == project.project.id;
            });

            if (memberships.length == 0) {
                throw new Error("You are not member of this project");
            }

            result.redmine_project_id = project.project.id;
            result.redmine_user_id = me.user.id;
            result.redmine_user_login = me.user.login;
            result.redmine_user_email = me.user.email;

            while (true) {
                var gitlab_project_name = (yield convertAsync(prompt, prompt.get, [['gitlab_project']])).gitlab_project;
                var projects = yield this.git_utils.searchProject(gitlab_project_name);
                if (projects.length <= 0) {
                    console.log("ERROR:Cannot find any project with name:%s", gitlab_project_name);
                    continue;
                }

                console.log("*************************************************************")
                for (var i = 0; i < projects.length; i++) {
                    console.log("Project %s: %s", i, projects[i].path_with_namespace);
                }
                console.log("****************Select project id in above*******************")
                var project_id = 0;
                while (true) {
                    project_id = parseInt((yield convertAsync(prompt, prompt.get, [['project_id']])).project_id);
                    if (project_id >= 0 || project_id < projects.length) {
                        break;
                    }
                }
                result.gitlab_project_id = projects[project_id].id;
                break;
            }
            // result.chat_channel = (yield convertAsync(prompt, prompt.get, [['chat_channel']])).chat_channel;
            console.log('result-ows', result);
            this.projectStorage.write(result);
            child_process.execSync('echo "\n.odf.json" >> .gitignore')

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