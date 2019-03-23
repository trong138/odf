"use strict";
const co = require('co');
const convertAsync = require('convert-async');

const GlobalStorage = require('../storages/global')
const request = require('request');

class GitlabUtils {
    constructor() {
        this.globalStorage = new GlobalStorage();
        this.auth = this.globalStorage.read();
    }

    makeArgs(data) {
        var args = {
            headers: { "PRIVATE-TOKEN": this.auth.gitlab_token }
        }

        if (data) {
            args.data = data;
        }

        return args;
    }

    post(uri, data) {
        return new Promise((resolve, reject) => {

            var options = {
                method: 'POST',
                url: this.auth.gitlab_host + "/api/v3" + uri,
                headers:
                {
                    "PRIVATE-TOKEN": this.auth.gitlab_token
                },
                formData: data
            };

            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                    return;
                }
            });
        });
    }

    get(uri) {
        return new Promise((resolve, reject) => {
            var options = {
                url: this.auth.gitlab_host + "/api/v3" + uri,
                headers: {
                    "PRIVATE-TOKEN": this.auth.gitlab_token
                }
            }

            console.log('ows-options', options);

            request(options, function (error, response, body) {
                if (error) {
                    reject(error);
                    return;
                }

                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                    return;
                }
            });
        });
    }

    project(id) {
        return this.get('/projects/' + id);
    }

    projects() {
        return this.get('/projects');
    }

    searchProject(search) {
        return this.get('/projects?simple=true&search=' + encodeURIComponent(search));
    }

    searchBranch(id, ) {
        return this.get('/projects/' + id + '/repository/branches');
    }

    getProject(project_name) {
        return this.get('/projects/' + encodeURIComponent(project_name));
    }

    createMergeRequest(project_id, from, to, title) {
        return this.post('/projects/' + project_id + '/merge_requests', {
            source_branch: from,
            target_branch: to,
            title: title
        })
    }
}

module.exports = GitlabUtils;