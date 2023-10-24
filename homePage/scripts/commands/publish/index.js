const publishBundle = require("./publishBundle");

const startCommand = {
    name: 'publish',
    func: publishBundle,
    description: 'Publish Bundle',
    options: [],
};

exports.command = startCommand;
