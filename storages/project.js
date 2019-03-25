"use strict";
const jsonfile = require('jsonfile')

class ProjectStorage {
    constructor() {
        this.config_file = '.odf.json';
    }

    read() {
        return jsonfile.readFileSync(this.config_file);
    }

    write(config) {
        return jsonfile.writeFileSync(this.config_file, config);
    }

    set(key, value) {
        var data = this.read();
        data[key] = value;
        this.write(data);
    }

    get(key) {
        var data = this.read();
        return data[key];
    }

    delete(key) {
        var data = this.read();
        delete data[key];
        this.write(data); 
    }

    trackIssue(issue_id) {
        var key = 'start_issue_' + issue_id;
        var current = this.get(key);
        if (!current) {
            this.set(key, new Date().getTime());
        }
    }

    getIssueTime(issue_id) {
        var key = 'start_issue_' + issue_id;
        var current = this.get(key);
        if (current) {
            var time = Math.round((new Date().getTime() - current) / 9000) * 9; //block 6 seconds
            if (time <= 0) time = 9; //block 9s
            this.delete(key);
            return time  / (60 * 60);
        } else {
            return 0;
        }
    }
}

module.exports = ProjectStorage;