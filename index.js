#!/usr/bin/env node
var program = require('commander');
var actions = require('./actions/loader');

program
  .arguments('<action> [params...]')
  .option('-m, --message <message>', 'The commit message')
  .action(function(action, params, program) {
    if(actions[action]){
        var action_instance = new actions[action](params, program);
        var promise = new Promise((resolve, reject) => {
            action_instance.do(resolve, reject);
        });

        promise.then((data) => {
            console.log("Success to do:", data);
            process.exit();
        }).catch((err) => {
            console.error(err);
            process.exit();
        });
    }else{
        var proxy_instance = new actions['*']([action].concat(params), program);
        var promise = new Promise((resolve, reject) => {
            proxy_instance.do(resolve, reject);
        });
    }
  })
  .parse(process.argv);