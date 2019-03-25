"use strict";
const co = require('co');
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const date_diff = require('date-diff');
const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');

class InfoAction {
    constructor(params) {
        this.params = params;
        this.redmine_utils = new RedmineUtils();
        this.git_branch_utils = new GitBranchUtils();
    }

    do(resolve, reject) {
        co((function* () {
            "use strict";
            var issue_id = '';
            if (this.params.length > 0) {
                issue_id = this.params[0];
            } else {
                issue_id = yield this.git_branch_utils.getCurrentIssue();
            }
            issue_id = parseInt(issue_id);
            console.log("Checking info for issue_id:" + issue_id);
            let issue_info = yield this.redmine_utils.checkIssue(issue_id);
            console.log('Issue_info: ', issue_info);
            return issue_id;
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports = InfoAction;