"use strict";
const jsonfile = require('jsonfile')
const convertAsync = require('convert-async');
const os = require('os');

class GlobalStorage{
    constructor(){
        this.config_file = os.homedir() + '/.odf.json';
    }

    read(){
        return jsonfile.readFileSync(this.config_file);
    }

    write(config){
        return jsonfile.writeFileSync(this.config_file, config);
    }
}

module.exports = GlobalStorage;