"use strict";
const ProjectStorage = require('../storages/project')
const request = require('request');

class GithubUtils {
    constructor() {
        this.projectStorage = new ProjectStorage();
        this.project = this.projectStorage.read();
    }

    post(uri, data) {
        return new Promise((resolve, reject) => {

            var options = {
                method: 'POST',
                url: this.project.git_host + uri,
                headers:
                {
                    "Authorization": "token " + this.project.git_token,
                    "user-agent": "Awesome-Octocat-App",
                    "Content-Type": "application/json"
                },
                json: data
            };

            request(options, function (error, response, body) {

                if (error) {
                    reject(error);
                    return;
                }

                try {
                    resolve(body);
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
                url: this.project.git_host + uri,
                headers: {
                    "Authorization": "token " + this.project.git_token,
                    'user-agent': 'Awesome-Octocat-App',
                    // 'Content-Type': 'application/json'
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

    createMergeRequest(from, to, title) {
        return this.post('/repos/' + this.project.git_project_path + '/pulls', {
            "title": title,
            "body": "finish",
            "head": from,
            "base": to
        })
    }
}

module.exports = GithubUtils;