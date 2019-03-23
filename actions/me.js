"use strict";
const co = require('co');
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const date_diff = require('date-diff');
const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');

class MeAction{
    constructor(params){
        this.params = params;
        this.redmine_utils = new RedmineUtils();
        this.git_branch_utils = new GitBranchUtils();
    }

    do(resolve, reject){
        function fixedLength(len, str){
            while(str.length < len){
                str += " ";
            }
            return str;
        }

        co((function* () {
            "use strict";
            
            console.log("Checking issues for you");
            let issues = (yield this.redmine_utils.getProjectIssues()).issues;
            
            console.log("\n\n------");
            issues.forEach((issue) => {
                var remain = new date_diff(new Date(issue.due_date), new Date()).days();
                console.log("[%s][%s][%s][%s] %s", 
                    fixedLength(17, issue.priority.name + " - " + issue.tracker.name),
                    fixedLength(5, issue.id),
                    fixedLength(8, remain + " days"),
                    fixedLength(20, issue.status.name + "-" + issue.done_ratio + "%"),
                    issue.subject
                );
            });
            console.log("------\n\n");
            return  issues.length + " Issues";
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports=MeAction;