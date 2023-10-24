const { command: startCommand } = require('./start/index')
const { command: bundleCommand } = require('./bundle/index')
const { command: publishCommand } = require("./publish/index")

exports.projectCommands = [startCommand, bundleCommand, publishCommand]