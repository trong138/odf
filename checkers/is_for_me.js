"use strict";
const co = require('co');
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');

class IsForMeChecker{
    constructor(){
        this.config = jsonfile.readFileSync('./.odf.json');
        this.redmine = new Redmine(this.config.redmine_host, {
            apiKey: this.config.redmine_apikey
        });
    }

    checkIssue(issue_id){
        return new Promise((resolve, reject) => {
            co((function* () {
                "use strict";
                let issue_info = yield this.getIssueInfo(issue_id);
                if (this.config.redmine_user_id != issue_info.issue.assigned_to.id &&
                    this.config.redmine_user_id != issue_info.issue.author.id) {
                    throw new Error("This issue_id is not for you!!");
                }

                if (this.config.redmine_project_id != issue_info.issue.project.id) {
                    throw new Error("This issue_id is not for this project!!");
                }

                return issue_info;
            }).bind(this)).then(function (value) {
                resolve(value);
            }, function (err) {
                reject(err);
            });
        });
    }

    checkProject(project_id){
        return new Promise((resolve, reject) => {
            co((function* () {
                "use strict";
                let me = yield this.getRedmineMe();
                let project = yield this.getProjectInfo(project_id);
                var memberships = me.user.memberships.filter((membership) => {
                    return membership.project.id == project_id;
                });

                if(memberships.length == 0){
                    throw new Error("You are not member of this project");
                }
            }).bind(this)).then(function (value) {
                resolve(value);
            }, function (err) {
                reject(err);
            });
        });
    }

    getIssueInfo(issue_id){
        return convertAsync(this.redmine, this.redmine.get_issue_by_id, [issue_id, {}]);
    }

    getProjectInfo(project_id){
        return convertAsync(this.redmine, this.redmine.get_project_by_id, [project_id, {}]);
    }

    getRedmineMe(){
        return convertAsync(this.redmine, this.redmine.current_user, [{include:'memberships'}]);
    }
}

module.exports = IsForMeChecker;