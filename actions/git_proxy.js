"use strict";
const co = require('co');
const spawn = require('child_process').spawn;

class GitProxyAction{
    constructor(params){
        this.params = params;
    }

    do(resolve, reject){
        console.log(this.params);
        var process = spawn("git", this.params, {stdio: "inherit"});

        process.on('close', (code) => {
            if(code != 0){
                reject(new Error(`child process exited with code ${code}`));
            }else
                resolve(code);
        });
    }
}

module.exports=GitProxyAction;