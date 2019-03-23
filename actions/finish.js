"use strict";
const simple_git = require('simple-git');
const co = require('co');
const os = require("os");
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const date_diff = require('date-diff');
const string_template = require('string-template');

const GlobalStorage = require('../storages/global')
const ProjectStorage = require('../storages/project')
const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');
const GitLabUtils = require('../libs/gitlab_utils');
const ChatUtils = require('../libs/chat_utils');


class FinishAction{
    constructor(params){
        this.git = simple_git('./');
        this.params = params;
        this.gitlab_utils = new GitLabUtils();
        this.git_branch_utils = new GitBranchUtils();
        this.globalStorage = new GlobalStorage();
        this.projectStorage = new ProjectStorage();
        this.redmine_utils = new RedmineUtils();
        this.chat_utils = new ChatUtils();
        this.auth = this.globalStorage.read();
        this.project = this.projectStorage.read();
    }

    do(resolve, reject){
        co((function* () {
            "use strict";
            let git_status = yield this.git_branch_utils.status();
            let current_branch = git_status.current;

            let issue_id = yield this.git_branch_utils.getCurrentIssue();
            console.log("Checking info for issue_id:" + issue_id);
            let issue_info = yield this.redmine_utils.checkIssue(issue_id);

            if(issue_info.issue.status.name != "In Progress"){
                throw new Error("This issue status:" + issue_info.issue.status.name + " is not In Progress, please checking again");
            }

            var to_branch = this.redmine_utils.getValueFromArray(issue_info.issue.custom_fields, 'Git: merge to')
            if(to_branch == null){
                throw new Error("Please define 'Git: merge to' from custom_field");
            }
            
            var issue_type = issue_info.issue.tracker.name.toLowerCase();
            console.log("Pushing to " + current_branch + "....");
            var result2 = yield this.git_branch_utils.push('origin', current_branch);
            console.log("Creating merge requests....");
            var title = ((issue_type === "bug") ? "Fixed issue:" : "Created feature:") + issue_id + ". Merge to ";

            var gitlab_project_info = yield this.gitlab_utils.project(this.project.gitlab_project_id);
            var to_branchs = to_branch.split(";");
            for(var i = 0; i < to_branchs.length; i++){
                let branch = to_branchs[i];
                console.log("   to " + branch);
                let res = yield this.gitlab_utils.createMergeRequest(this.project.gitlab_project_id, current_branch, branch, title + branch);
                if(res.id){ //created
                    var mr_link = res.web_url;
                    yield this.chat_utils.log("User created merge request", `[Git-MR]Finished #${issue_id}. Merge request to branch ${branch}`, `User @${this.auth.redmine_user_login}`, mr_link);
                }else{ //already exited
                    var mrs_link = gitlab_project_info.web_url + "/merge_requests";
                    yield this.chat_utils.log("User created merge request but: This merge request already exists", `[Git-MR]Finished #${issue_id}. Merge request to branch ${branch}`, `User @${this.auth.redmine_user_login}`, mrs_link);
                }
            }
            console.log("Update redmine issue");

            var notes_template = 
                    "Finished this issue.\n" + 
                    "Device: *{device}*\n\n";
            var notes = string_template(notes_template, {
                device:  os.hostname()
            });

            yield this.redmine_utils.updateIssue(issue_id, {
                issue:{
                    status_id: 8,
                    notes: notes,
                    done_ratio: 100
                }
            });

            yield this.redmine_utils.trackIssueLog(issue_id, `Finished`, true);

            var issue_link = `${this.auth.redmine_host}/issues/${issue_id}`;
            yield this.chat_utils.log("User finished issue", `[Redmine] Finished #${issue_id}: ${issue_info.issue.subject}`, `User @${this.auth.redmine_user_login}`, issue_link);

            return "Finished Issue:" + issue_id;
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports = FinishAction;