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
const ProjectStorage = require('../storages/project')
const GlobalStorage = require('../storages/global')
const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');
const GitLabUtils = require('../libs/gitlab_utils');
// const ChatUtils = require('../libs/chat_utils');

class SwitchAction {
    constructor(params) {
        this.git = simple_git('./');
        this.params = params;
        // this.chat_utils = new ChatUtils();
        this.git_branch_utils = new GitBranchUtils();
        this.gitlab_utils = new GitLabUtils();
        this.globalStorage = new GlobalStorage();
        this.redmine_utils = new RedmineUtils();
        this.projectStorage = new ProjectStorage();
        this.auth = this.globalStorage.read();
        this.project = this.projectStorage.read();
    }

    do(resolve, reject) {
        co((function* () {
            "use strict";
            if (this.params.length <= 0) {
                throw new Error("Usage: odf switch ISSUE_ID");
            }

            var previous_issue_id = yield this.git_branch_utils.getCurrentIssue();
            console.log('pre', previous_issue_id);
            let issue_id = parseInt(this.params[0]);

            if (issue_id + '' != this.params[0]) {
                throw new Error("Usage: odf switch ISSUE_ID");
            }

            if (issue_id == previous_issue_id) {
                throw new Error("Usage: switch to id must to different with current id:" + previous_issue_id);
            }

            console.log("Checking info for issue_id:" + issue_id);
            let issue_info = yield this.redmine_utils.checkIssue(issue_id);

            if (issue_info.issue.status.name == "New") {
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

            // var short_des_text = this.redmine_utils.getValueFromArray(issue_info.issue.custom_fields, 'short_issue_content');

            // if(short_des_text == null){
            //     throw new Error("Please define short_issue_content custom_field");
            // }
            // short_des_text = short_des_text.toLowerCase();

            var list_branch = yield this.gitlab_utils.searchBranch(this.project.gitlab_project_id);

            var list_branch_name_search = [];
            for (let i = 0; i < list_branch.length; i++) {
                if (list_branch[i].name.indexOf(issue_id) != -1) {
                    list_branch_name_search.push(list_branch[i].name);
                }
            }

            if (list_branch_name_search.length <= 0) {
                console.log("ERROR:Cannot find any branch with issue_id:%s", issue_id);
                throw new Error("Branch related this issue_id is not exist");
            }

            console.log("*************************************************************")
            for (var i = 0; i < list_branch_name_search.length; i++) {
                console.log("Project %s: %s", i, list_branch_name_search[i]);
            }
            console.log("****************Select branch id in above*******************")
            var branch_id = 0;
            while (true) {
                branch_id = parseInt((yield convertAsync(prompt, prompt.get, [['branch_id']])).branch_id);
                if (branch_id < 0 || branch_id >= list_branch_name_search.length) {
                    continue;
                }
                break;
            }
            var branch = list_branch_name_search[branch_id];

            // var from_branch = this.redmine_utils.getValueFromArray(issue_info.issue.custom_fields, 'Git: checkout from')
            // if(from_branch == null){
            //     throw new Error("Please define 'Git: checkout' from custom_field");
            // }

            // var branch = this.git_branch_utils.generateBranch(issue_info.issue.tracker.name.toLowerCase()
            //     , issue_info.issue.id, short_des_text);
            // console.log(branch, from_branch);

            try {
                yield this.git_branch_utils.fetchFrom(branch)
            } catch (e) {
                console.log("Cannot fetch %s", branch);
            }
            console.log('checkout', branch);
            try {
                yield this.git_branch_utils.checkoutTo(branch);
            } catch (e) {
                throw new Error("Cannot checkout %s", branch);
            }

            var notes_template =
                "Continued working on this issue.\n" +
                "Device: *{device}*\n\n" +
                "<pre>\n" +
                "Reason:{reason}\n" +
                "</pre>\n";
            var notes = string_template(notes_template, {
                device: os.hostname(),
                reason: reason_input.reason
            });

            yield this.redmine_utils.updateIssue(issue_id, {
                issue: {
                    status_id: 2,
                    notes: notes
                }
            });
            if (previous_issue_id != null) {
                let previous_issue_info = yield this.redmine_utils.checkIssue(previous_issue_id, true);
                var state = previous_issue_info.issue.status.name
                if (state === "In Progress") {
                    var notes = "Switched to working on issue #" + issue_id + ".";
                    notes += "\nDevice:" + os.hostname();
                    notes += "\n\nReason:" + reason_input.reason;
                    yield this.redmine_utils.updateIssue(previous_issue_id, {
                        issue: {
                            notes: notes
                        }
                    });
                    yield this.redmine_utils.trackIssueLog(previous_issue_id, `Swiched to #${issue_id}. Temp save time for this issue`, false);
                }
            }
            this.redmine_utils.startIssue(issue_id);

            // var issue_link = `${this.auth.redmine_host}/issues/${issue_id}`;
            // yield this.chat_utils.log("User switched to issue", `Switched to #${issue_id}: ${issue_info.issue.subject}`, `User @${this.auth.redmine_user_login}.\nReason ${reason_input}`, issue_link);

            return issue_id;
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports = SwitchAction;