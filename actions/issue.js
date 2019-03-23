"use strict";
const prompt = require('prompt');
const co = require('co');
const jsonfile = require('jsonfile')
const Redmine = require('node-redmine');
const convertAsync = require('convert-async');
const date_diff = require('date-diff');
const RedmineUtils = require('../libs/redmine_utils');
const GitBranchUtils = require('../libs/git_branch');

class IssueAction{
    constructor(params){
        this.params = params;
        this.redmine_utils = new RedmineUtils();
        this.git_branch_utils = new GitBranchUtils();
    }

    do(resolve, reject){
        co((function* () {
            "use strict";

            var info = yield convertAsync(prompt, prompt.get, [[
                'subject',
                'description',
                'is_bug',
                'assigned_to',
                'checkout_from',
                'merge_to',
                'short_id'
            ]]);

            var users = yield this.redmine_utils.getUsers(info.assigned_to);
            if(users.users.length <= 0){
                throw new Error("User not found");
            }

            var tracker_id = (info.is_bug == '1' || info.is_bug == 'true' ||  info.is_bug == 'yes') ? 1 : 2;
            var custom_fields = yield this.redmine_utils.getCustomFields();
            var check_from_field_id = this.redmine_utils.getObjectFromArray(custom_fields.custom_fields, 'Git: checkout from').id;
            var merge_to_field_id = this.redmine_utils.getObjectFromArray(custom_fields.custom_fields, 'Git: merge to').id;
            var short_field_id = this.redmine_utils.getObjectFromArray(custom_fields.custom_fields, 'short_issue_content').id;

            var result = yield this.redmine_utils.createIssue({
                issue:{
                    "subject": info.subject,
                    "description": info.description,
                    "tracker_id": tracker_id,
                    "assigned_to_id": users.users[0].id,
                    "custom_fields":
                        [
                            {"value":info.checkout_from,"id": check_from_field_id},
                            {"value":info.merge_to,"id": merge_to_field_id},
                            {"value":info.short_id,"id": short_field_id}
                        ]
                }
            });

            return "Created issue: #" + result.issue.id;
        }).bind(this)).then(function (value) {
            resolve(value);
        }, function (err) {
            reject(err);
        });
    }
}

module.exports=IssueAction;