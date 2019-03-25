"use strict";
const child_process = require('child_process');
const prompt = require('prompt');
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const co = require('co');
const ProjectStorage = require('../storages/project')
const GitLabUtils = require('../libs/gitlab_utils');
const GithubUtils = require('../libs/github_utils');

class InitAction {
    constructor(params) {
        this.projectStorage = new ProjectStorage();
        this.project = this.projectStorage.read();
        if (this.project.git_host.indexOf("ows") != -1 || this.project.git_host.indexOf("lab") != -1) { // gitlab
            this.type_git = "gitlab";
            this.git_utils = new GitLabUtils();
        } else if (this.project.git_host.indexOf("github") != -1) { // github
            this.type_git = "github";
            this.git_utils = new GithubUtils();
        }
    }

    do(resolve, reject) {
        prompt.start();
        co((function* () {
            "use strict";
            var result = {};
            var result = this.project;
            console.log(result);
            this.redmine = new Redmine(result.redmine_host, {
                apiKey: result.redmine_apikey
            });

            // identify redmine_project ////////////////////////////////////////////////////////////////////////////////
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
            // identify git_project
            var git_project_name = (yield convertAsync(prompt, prompt.get, [['git_project']])).git_project;
            // search project_git
            var _projects = yield this.git_utils.searchProject(git_project_name);
            if (!(Array.isArray(_projects) && _projects.length > 0)) throw new Error("ERROR:Cannot find any project with name:" + git_project_name);
            var projects = [];
            if (this.type_git == "gitlab") { // gitlab
                var projects = _projects;
                if (projects.length <= 0) {
                    throw new Error("ERROR:Cannot find any project with name:" + git_project_name);
                }
                console.log("*************************************************************")
                for (var i = 0; i < projects.length; i++) {
                    console.log("Project %s: %s", i, projects[i].path_with_namespace);
                }
                console.log("****************Select project id in above*******************")
            } else if (this.type_git == "github") { // github
                for (let i = 0; i < _projects.length; i++) {
                    if (_projects[i].name.indexOf(git_project_name) != -1) {
                        projects.push(_projects[i]);
                    }
                }

                if (projects.length <= 0) {
                    throw new Error("ERROR:Cannot find any project with name:" + git_project_name);
                }
                console.log("*************************************************************")
                for (var i = 0; i < projects.length; i++) {
                    console.log("Project %s: %s", i, projects[i].full_name);

                }
                console.log("****************Select project id in above*******************")
            }

            // set project id
            var project_id = 0;
            while (true) {
                project_id = parseInt((yield convertAsync(prompt, prompt.get, [['project_id']])).project_id);
                if (project_id >= 0 && project_id < projects.length) {
                    break;
                }
            }
            result.git_project_id = projects[project_id].id;
            result.git_project_path = projects[project_id].full_name;
            // console.log('result-ows', result);
            this.projectStorage.write(result);
            // child_process.execSync('echo "\n.odf.json" >> .gitignore')

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