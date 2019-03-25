"use strict";
const simple_git = require('simple-git');
const co = require('co');
const os = require("os");
const string_template = require('string-template');

const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');
const GitLabUtils = require('../libs/gitlab_utils');
const GithubUtils = require('../libs/github_utils');
const ProjectStorage = require('../storages/project')

class FinishAction {
    constructor(params) {
        this.git = simple_git('./');
        this.params = params;
        this.projectStorage = new ProjectStorage();
        this.project = this.projectStorage.read();
        if (this.project.git_host.indexOf("ows") != -1 || this.project.git_host.indexOf("lab") != -1) { // gitlab
            this.type_git = "gitlab";
            this.git_utils = new GitLabUtils();
        } else if (this.project.git_host.indexOf("github") != -1) { // github
            this.type_git = "github";
            this.git_utils = new GithubUtils();
        }
        this.git_branch_utils = new GitBranchUtils();
        this.redmine_utils = new RedmineUtils();
    }

    do(resolve, reject) {
        co((function* () {
            "use strict";
            let git_status = yield this.git_branch_utils.status();
            let current_branch = git_status.current;
            let issue_id = yield this.git_branch_utils.getCurrentIssue();
            console.log("Checking info for issue_id:" + issue_id);
            let issue_info = yield this.redmine_utils.checkIssue(issue_id);

            if (issue_info.issue.status.name != "In Progress") {
                throw new Error("This issue status:" + issue_info.issue.status.name + " is not In Progress, please checking again");
            }
            var to_branch = this.params[0];
            if (!to_branch) {
                throw new Error("Please define 'Git: merge to', flow syntax 'odf finish [branch_merge]'");
            }
            // throw new Error("");
            var issue_type = issue_info.issue.tracker.name.toLowerCase();
            console.log("Pushing to " + current_branch + "....");
            yield this.git_branch_utils.push('origin', current_branch);
            console.log("Creating merge requests....");
            var title = ((issue_type === "bug") ? "Fixed issue:" : "Created feature:") + issue_id + ". Merge to ";
            yield this.git_utils.createMergeRequest(current_branch, to_branch, title + to_branch);
            console.log("Update redmine issue");

            var notes_template =
                "Finished this issue.\n" +
                "Device: *{device}*\n\n";
            var notes = string_template(notes_template, {
                device: os.hostname()
            });

            yield this.redmine_utils.updateIssue(issue_id, {
                issue: {
                    status_id: 8,
                    notes: notes,
                    done_ratio: 100
                }
            });

            yield this.redmine_utils.trackIssueLog(issue_id, `Finished`, true);
            return "Finished Issue:" + issue_id;
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports = FinishAction;