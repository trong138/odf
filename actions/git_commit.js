"use strict";
const co = require('co');
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const date_diff = require('date-diff');
const prompt = require('prompt');
const os = require('os');
const string_template = require('string-template');

const GlobalStorage = require('../storages/global')
const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');
const ChatUtils = require('../libs/chat_utils');

class GitCommitAction {
    constructor(params, commander) {
        console.log('commit', params, commander.message);
        this.params = params;
        this.commander = commander;
        this.globalStorage = new GlobalStorage();
        this.redmine_utils = new RedmineUtils();
        this.git_branch_utils = new GitBranchUtils();
        // this.chat_utils = new ChatUtils();
        this.auth = this.globalStorage.read();
    }

    do(resolve, reject) {
        co((function* () {
            "use strict";
            let predefined = this.commander.message;

            let issue_id = yield this.git_branch_utils.getCurrentIssue();
            let git_status = yield this.git_branch_utils.status();
            let current_branch = git_status.current;

            if (git_status.files.length <= 0) {
                throw new Error("Dont have anything to commit");
            }

            console.log("Checking info for issue_id:" + issue_id);
            let issue_info = yield this.redmine_utils.checkIssue(issue_id);

            console.log("Issue_id: %s", issue_info.issue.id);
            console.log("Issue_author: %s", issue_info.issue.author.name);
            console.log("Issue_assigned: %s", issue_info.issue.assigned_to.name);
            console.log("Issue_subject: %s", issue_info.issue.subject);
            console.log("Issue_done: %s%", issue_info.issue.done_ratio);
            console.log("Issue_deadline: %s", new Date(issue_info.issue.due_date));
            console.log("Issue_deadline remain %s days", new date_diff(new Date(issue_info.issue.due_date), new Date()).days());
            console.log("\n-----------------------------------------------");

            var comment_input = predefined ? predefined : (yield convertAsync(prompt, prompt.get, [['comment']])).comment;

            var result = yield this.git_branch_utils.commit(comment_input + ". ref #" + issue_id);

            var result2 = yield this.git_branch_utils.push('origin', current_branch);

            var current_hash = (yield this.git_branch_utils.currentHash()).trim();
            var remote_url = (yield this.git_branch_utils.getGitUrl("origin")).trim().replace(".git", "");
            var commit_url = remote_url + "/commit/" + current_hash;
            var branch_url = remote_url + "/network/" + current_branch;

            var notes_template =
                "Commit: {commit}\n" +
                "Device: *{device}*\n\n" +
                "Branch: [{branch}]({branch_url})\n" +
                "[Changed files]({commit_url})";
            var notes = string_template(notes_template, {
                device: os.hostname(),
                commit: comment_input,
                commit_url: commit_url,
                branch_url: branch_url,
                branch: current_branch
            });

            yield this.redmine_utils.updateIssue(issue_id, {
                issue: {
                    status_id: 2,
                    notes: notes
                }
            });

            yield this.redmine_utils.trackIssueLog(issue_id, `Commit: ${comment_input}`, true);

            // var issue_link = `${this.auth.redmine_host}/issues/${issue_id}`;
            // yield this.chat_utils.log("User commit to issue", `Commit to #${issue_id}: ${issue_info.issue.subject}`, `User @${this.auth.redmine_user_login}.\n${comment_input}`, issue_link);

            return issue_id;
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports = GitCommitAction;