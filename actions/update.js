"use strict";
const prompt = require('prompt');
const simple_git = require('simple-git');
const co = require('co');
const os = require("os");
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const date_diff = require('date-diff');
const string_template = require('string-template');

const GlobalStorage = require('../storages/global')
const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');
const ChatUtils = require('../libs/chat_utils');

class UpdateAction{
    constructor(params){
        this.git = simple_git('./');
        this.params = params;
        this.redmine_utils = new RedmineUtils();
        this.globalStorage = new GlobalStorage();
        this.git_branch_utils = new GitBranchUtils();
        this.chat_utils = new ChatUtils();
        this.auth = this.globalStorage.read();
    }

    do(resolve, reject){
        co((function* () {
            "use strict";
            if(this.params.length <= 0){
                throw new Error("Usage: odf update PROGRESS_PERCENT_NUMBER");
            }

            let percent = parseInt(this.params[0]);
            if(percent + '' != this.params[0] + ''){
                throw new Error("Usage: odf update PROGRESS_PERCENT");
            }
            let issue_id = yield this.git_branch_utils.getCurrentIssue();
            console.log("Checking info for issue_id:" + issue_id);
            let issue_info = yield this.redmine_utils.checkIssue(issue_id);

            if(issue_info.issue.status.name != "In Progress"){
                throw new Error("This issue status:" + issue_info.issue.status.name + " is not In Progress, please checking again");
            }

            if(percent == issue_info.issue.done_ratio){
                throw new Error("New percent must different current percent: " + issue_info.issue.done_ratio + "%");
            }

            var comment_input = (yield convertAsync(prompt, prompt.get, [['comment']])).comment;

            var notes_template = 
                    "Info: {commit}\n" +
                    "Device: *{device}*\n\n";
            var notes = string_template(notes_template, {
                device:  os.hostname(),
                commit: comment_input
            });

            yield this.redmine_utils.updateIssue(issue_id, {
                issue:{
                    status_id: 2,
                    notes: notes,
                    done_ratio: percent
                }
            });

            yield this.redmine_utils.trackIssueLog(issue_id, `Update to ${percent}%. ${comment_input}`, true);

            var issue_link = `${this.auth.redmine_host}/issues/${issue_id}`;
            yield this.chat_utils.log("User updated issue progress", `Updated #${issue_id} to ${percent}%: ${issue_info.issue.subject}`, `User @${this.auth.redmine_user_login}. \n${comment_input}`, issue_link);

            return "Updated process of Issuce:" + issue_id + " to " + percent + "%";
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports = UpdateAction;