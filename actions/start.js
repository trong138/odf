"use strict";
const prompt = require('prompt');
const simple_git = require('simple-git');
const co = require('co');
const os = require("os");
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const date_diff = require('date-diff');

const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');
const GlobalStorage = require('../storages/global')
const ProjectStorage = require('../storages/project')
// const ChatUtils = require('../libs/chat_utils');

class StartAction {
    constructor(params) {
        console.log('ows-start-params', params);
        this.git = simple_git('./');
        this.params = params;
        // this.chat_utils = new ChatUtils();
        this.globalStorage = new GlobalStorage();
        this.redmine_utils = new RedmineUtils();
        this.git_branch_utils = new GitBranchUtils();
        this.projectStorage = new ProjectStorage();
        this.auth = this.globalStorage.read();
    }

    do(resolve, reject) {
        co((function* () {
            "use strict";

            var previous_issue_id = yield this.git_branch_utils.getCurrentIssue();

            if (this.params.length <= 0) {
                throw new Error("Usage: odf start ISSUE_ID");
            }

            let issue_id = parseInt(this.params[0]);

            console.log("Checking info for issue_id:" + issue_id);
            let issue_info = yield this.redmine_utils.checkIssue(issue_id);

            console.log('ows-issue_info', issue_info);

            if (issue_info.issue.status.name != "New") {
                throw new Error("This issue status:" + issue_info.issue.status.name + " is not New, please checking again or using switch command");
            }

            // console.log("Issue_id: %s", issue_info.issue.id);
            // console.log("Issue_author: %s", issue_info.issue.author.name);
            // console.log("Issue_assigned: %s", issue_info.issue.assigned_to.name);
            // console.log("Issue_subject: %s", issue_info.issue.subject);
            // console.log("Issue_deadline: %s", new Date(issue_info.issue.due_date));
            // console.log("Issue_deadline remain %s days", new date_diff(new Date(issue_info.issue.due_date), new Date()).days());

            // var short_des_text = this.redmine_utils.getValueFromArray(issue_info.issue.custom_fields, 'short_issue_content');

            // if (short_des_text == null) {
            //     throw new Error("Please define short_issue_content custom_field");
            // }
            // short_des_text = short_des_text.toLowerCase();

            // var from_branch = this.redmine_utils.getValueFromArray(issue_info.issue.custom_fields, 'Git: checkout from')
            // if (from_branch == null) {
            //     throw new Error("Please define 'Git: checkout' from custom_field");
            // }

            // var branch = this.git_branch_utils.generateBranch(issue_info.issue.tracker.name.toLowerCase()
            //     , issue_info.issue.id, short_des_text);
            if (!issue_info.issue.tracker.name) {
                throw new Error("This issue tracker name error");
            }
            if (!this.params[1] || !this.params[2]) {
                throw new Error("Branch checkout or Describe not exist, flow syntax : odf start [issue_id] [from_branch] [describe]");
            }

            var branch = issue_info.issue.tracker.name + '_' + this.params[0] + '_' + this.params[2];
            var from_branch = this.params[1];
            console.log('git-branch', branch, from_branch, `origin/${from_branch}`);

            try {
                yield this.git_branch_utils.fetchFrom(from_branch)
            } catch (e) {
                console.log("Cannot fetch %s", branch);
            }
            yield this.git_branch_utils.checkoutFromTo(`origin/${from_branch}`, branch);

            var reason_input = null;
            if (previous_issue_id != null) {
                let previous_issue_info = yield this.redmine_utils.checkIssue(previous_issue_id, true);
                var state = previous_issue_info.issue.status.name
                if (state === "In Progress") {
                    reason_input = yield convertAsync(prompt, prompt.get, [['reason']]);
                    var notes = "Switched to working on issue #" + issue_id + ".";
                    notes += "\nDevice:" + os.hostname();
                    notes += "\n\nReason:" + reason_input.reason;
                    console.log('update-issue', previous_issue_info, notes);
                    yield this.redmine_utils.updateIssue(previous_issue_id, {
                        issue: {
                            notes: notes
                        }
                    });
                    yield this.redmine_utils.trackIssueLog(previous_issue_id, `Started other issue: #${issue_id}. Temp save time for this issue`, false);
                }
            }

            var notes = "Started working on this issue.";
            notes += "\nDevice:" + os.hostname();
            if (reason_input != null) notes += "\n\nReason:" + reason_input.reason;
            yield this.redmine_utils.updateIssue(issue_id, {
                issue: {
                    status_id: 2,
                    notes: notes,
                    done_ratio: 0
                }
            });
            console.log('start-issue');
            this.redmine_utils.startIssue(issue_id);

            // var issue_link = `${this.auth.redmine_host}/issues/${issue_id}`;
            // yield this.chat_utils.log("User started issue", `Started #${issue_id}: ${issue_info.issue.subject}`, `User @${this.auth.redmine_user_login}`, issue_link);

            return issue_id;
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports = StartAction;