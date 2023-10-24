#!/usr/bin/env node

const cli = require("./index");

if (require.main === module) {
    cli.run()
}

module.exports = cli;