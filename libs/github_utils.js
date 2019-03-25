"use strict";
const co = require('co');
const convertAsync = require('convert-async');

const ProjectStorage = require('../storages/project')
const request = require('request');

class GithubUtils {
    constructor() {
        this.projectStorage = new ProjectStorage();
        this.auth = this.projectStorage.read();
    }

    post(uri, data) {
        return new Promise((resolve, reject) => {

            var options = {
                method: 'POST',
                url: this.auth.git_host + "/api/v3" + uri,
                headers:
                {
                    "PRIVATE-TOKEN": this.auth.git_token
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
                url: this.auth.git_host + uri,
                headers: {
                    "Authorization": "token " + this.auth.git_token,
                    'user-agent': 'Awesome-Octocat-App'
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
        return this.get('/user/repos');
    }

    searchBranch(id) {
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

module.exports = GithubUtils;