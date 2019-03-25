"use strict";
const prompt = require('prompt');
const simple_git = require('simple-git');
const co = require('co');
const os = require("os");
const convertAsync = require('convert-async');

const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');
const ProjectStorage = require('../storages/project')

class StartAction {
    constructor(params) {
        this.git = simple_git('./');
        this.params = params;
        this.redmine_utils = new RedmineUtils();
        this.git_branch_utils = new GitBranchUtils();
        this.projectStorage = new ProjectStorage();
    }

    do(resolve, reject) {
        co((function* () {
            "use strict";

            var previous_issue_id = yield this.git_branch_utils.getCurrentIssue();
            console.log(previous_issue_id);
            throw new Error("Usage: odf start ISSUE_ID");
            if (this.params.length <= 0) {
                throw new Error("Usage: odf start ISSUE_ID");
            }

            let issue_id = parseInt(this.params[0]);

            console.log("Checking info for issue_id:" + issue_id);
            let issue_info = yield this.redmine_utils.checkIssue(issue_id);

            // console.log('ows-issue_info', issue_info);

            if (issue_info.issue.status.name != "New") {
                throw new Error("This issue status:" + issue_info.issue.status.name + " is not New, please checking again or using switch command");
            }
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
            this.redmine_utils.startIssue(issue_id);
            return issue_id;
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports = StartAction;