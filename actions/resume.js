"use strict";
const simple_git = require('simple-git');
const co = require('co');
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const date_diff = require('date-diff');
const os = require('os');
const prompt = require('prompt');
const string_template = require('string-template');

const GlobalStorage = require('../storages/global')
const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');
// const ChatUtils = require('../libs/chat_utils');

class ResumeAction{
    constructor(params){
        this.git = simple_git('./');
        this.params = params;
        // this.chat_utils = new ChatUtils();
        this.git_branch_utils = new GitBranchUtils();
        this.globalStorage = new GlobalStorage();
        this.redmine_utils = new RedmineUtils();
        this.auth = this.globalStorage.read();
    }

    do(resolve, reject){
        co((function* () {
            "use strict";

            var issue_id = yield this.git_branch_utils.getCurrentIssue();

            console.log("Checking info for issue_id:" + issue_id);
            let issue_info = yield this.redmine_utils.checkIssue(issue_id);

            if(issue_info.issue.status.name == "New"){
                throw new Error("This issue status:" + issue_info.issue.status.name + " is not started, please checking again or using start command");
            }

            prompt.start();
            var reason_input = yield convertAsync(prompt, prompt.get, [['reason']]);

            console.log("Issue_id: %s", issue_info.issue.id);
            console.log("Issue_author: %s", issue_info.issue.author.name);
            console.log("Issue_assigned: %s", issue_info.issue.assigned_to.name);
            console.log("Issue_subject: %s", issue_info.issue.subject);
            console.log("Issue_deadline: %s", new Date(issue_info.issue.due_date));
            console.log("Issue_deadline remain %s days", new date_diff(new Date(issue_info.issue.due_date), new Date()).days());

            var notes_template = 
                    "Resume working on this issue.\n" + 
                    "Device: *{device}*\n\n" +
                    "<pre>\n" +
                    "Reason:{reason}\n" +
                    "</pre>\n";
            var notes = string_template(notes_template, {
                device:  os.hostname(),
                reason: reason_input.reason
            });

            yield this.redmine_utils.updateIssue(issue_id, {
                issue:{
                    notes: notes
                }
            });

            this.redmine_utils.startIssue(issue_id);

            // var issue_link = `${this.auth.redmine_host}/issues/${issue_id}`;
            // yield this.chat_utils.log("User resume issue", `Resume #${issue_id}: ${issue_info.issue.subject}`, `User @${this.auth.redmine_user_login}.\nReason ${reason_input}`, issue_link);

            return issue_id;
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports=ResumeAction;