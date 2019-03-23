"use strict";
const co = require('co');
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');

const GlobalStorage = require('../storages/global')
const ProjectStorage = require('../storages/project')

class RedmineUtils{
    constructor(){
        this.globalStorage = new GlobalStorage();
        this.projectStorage = new ProjectStorage();
        this.auth = this.globalStorage.read();
        this.project = this.projectStorage.read();
        this.redmine = new Redmine(this.auth.redmine_host, {
            apiKey: this.auth.redmine_apikey
        });
    }

    checkIssue(issue_id){
        return new Promise((resolve, reject) => {
            co((function* () {
                "use strict";
                let issue_info = yield this.getIssueInfo(issue_id);
                if(!issue_info.issue.assigned_to){
                    throw new Error("This issue_id is not for you!");
                }

                if (this.auth.redmine_user_id != issue_info.issue.assigned_to.id &&
                    this.auth.redmine_user_id != issue_info.issue.author.id) {
                    throw new Error("This issue_id is not for you!!");
                }

                if (this.project.redmine_project_id != issue_info.issue.project.id) {
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

    updateIssue(issue_id, params){
        return convertAsync(this.redmine, this.redmine.update_issue, [
            issue_id,
            params
        ]);
    }

    getValueFromArray(array_fields, field_id){
        if(!array_fields){
            return null;
        }else{
            var filter = array_fields.filter((field) => {
                return field.name === field_id;
            });

            if(filter.length == 0){
                return null;
            }

            return filter[0].value;
        }
    }

    getObjectFromArray(array_fields, field_value){
        return this.getObjectFromArrayRaw(array_fields, field_value, "name");
    }

    getObjectFromArrayRaw(array_fields, field_value, field_id){
        if(!array_fields){
            return null;
        }else{
            var filter = array_fields.filter((field) => {
                return field[field_id] === field_value;
            });

            if(filter.length == 0){
                return null;
            }

            return filter[0];
        }
    }

    startIssue(issue_id){
        this.projectStorage.trackIssue(issue_id);
    }

    getIssueTimeLogs(){
        return convertAsync(this.redmine, this.redmine.time_entries, []);
    }

    trackIssueLog(issue_id, comment, is_continue){
        var log_hour = this.projectStorage.getIssueTime(issue_id);
        if(is_continue === true){
            this.projectStorage.trackIssue(issue_id);
        }

        if(log_hour == 0){
            return [];
        }

        var params = {
            time_entry:{
                issue_id: issue_id,
                hours: log_hour,
                comments: comment,
                activity_id: 9
            }
        }

        return convertAsync(this.redmine, this.redmine.create_time_entry, [
            params
        ]);
    }

    getCustomFields(){
        return convertAsync(this.redmine, this.redmine.custom_fields, []);
    }

    createIssue(issue){
        issue.project_id = this.project.redmine_project_id;
        return convertAsync(this.redmine, this.redmine.create_issue, [issue]);
    }

    getUsers(name){
        return convertAsync(this.redmine, this.redmine.users, [{
            name: name
        }]);
    }

    getProjectIssues(){
        var params = {
            project_id: this.project.redmine_project_id,
            assigned_to_id: this.auth.redmine_user_id
        };
        return convertAsync(this.redmine, this.redmine.issues, [params]);
    }
}

module.exports = RedmineUtils;