"use strict";
const ProjectStorage = require('../storages/project')
const request = require('request');

class GitlabUtils {
    constructor() {
        this.projectStorage = new ProjectStorage();
        this.project = this.projectStorage.read();
    }

    post(uri, data) {
        return new Promise((resolve, reject) => {

            var options = {
                method: 'POST',
                url: this.project.git_host + "/api/v3" + uri,
                headers:
                {
                    "PRIVATE-TOKEN": this.project.git_token
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
                url: this.project.git_host + "/api/v3" + uri,
                headers: {
                    "PRIVATE-TOKEN": this.project.git_token
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

    searchBranch(id) {
        return this.get('/projects/' + id + '/repository/branches');
    }

    getProject(project_name) {
        return this.get('/projects/' + encodeURIComponent(project_name));
    }

    createMergeRequest(from, to, title) {
        return this.post('/projects/' + this.project.git_project_id + '/merge_requests', {
            source_branch: from,
            target_branch: to,
            title: title
        })
    }
}

module.exports = GitlabUtils;