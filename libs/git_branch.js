"use strict";
const simple_git = require('simple-git');
const convertAsync = require('convert-async');

class GitBranchUtils{
    constructor(){
        this.git = simple_git('./');
    }

    getCurrentBranch(){
        return convertAsync(this.git, this.git.raw, [['rev-parse', '--abbrev-ref', 'HEAD']]);
    }
 
    getCurrentIssue(){
        return new Promise((resolve, reject) => {
            this.git.raw(['rev-parse', '--abbrev-ref', 'HEAD'], (err, result)=>{
                if(err){
                    reject(err);
                    return;
                }
                var ticket_id_raw = result.split('_')[1];
                var ticket_id = parseInt(ticket_id_raw);
                if(ticket_id_raw != ticket_id + ''){
                    resolve(null);
                    return;
                }
                resolve(ticket_id);
            });
        });
    }

    generateBranch(type, issue_id, issue_short){
        if(issue_short != null)
            return type + "_" + issue_id + "_" + issue_short;
        else
            return type + "_" + issue_id;
    }

    checkoutFromTo(from, to){
        return convertAsync(this.git, this.git.checkoutBranch, [to, from]);
    }

    fetchFrom(from){
        return convertAsync(this.git, this.git.fetch, ["origin", from]);
    }

    checkoutTo(to){
        return convertAsync(this.git, this.git.checkout, [to]);
    }

    add(files){
        return convertAsync(this.git, this.git.commit, files);
    }

    commit(message){
        return convertAsync(this.git, this.git.commit, [message]);
    }

    push(remote, branch){
        return convertAsync(this.git, this.git.push, [remote, branch]);
    }

    status(){
        return convertAsync(this.git, this.git.status, []);
    }

    currentHash(){
        return convertAsync(this.git, this.git.raw, [['rev-parse', 'HEAD']]);
    }

    getGitUrl(remote){
         return convertAsync(this.git, this.git.raw, [['config', '--get', 'remote.' + remote + '.url']]);
    }
}

module.exports = GitBranchUtils;