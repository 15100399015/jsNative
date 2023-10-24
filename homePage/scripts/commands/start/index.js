const path = require("path");
const runServer = require("./runServer");
const startCommand = {
    name: 'start',
    func: runServer,
    description: 'Start the React Native development server.',
    options: [
        {
            name: '--port <number>',
            parse: Number,
        },
        {
            name: '--host <string>',
            default: '',
        },
        {
            name: '--projectRoot <path>',
            description: 'Path to a custom project root',
            parse: (val) => path.resolve(val),
        },
        {
            name: '--watchFolders <list>',
            description: 'Specify any additional folders to be added to the watch list',
            parse: (val) => val.split(',').map((folder) => path.resolve(folder)),
        },
        {
            name: '--assetPlugins <list>',
            description: 'Specify any additional asset plugins to be used by the packager by full filepath',
            parse: (val) => val.split(','),
        },
        {
            name: '--sourceExts <list>',
            description: 'Specify any additional source extensions to be used by the packager',
            parse: (val) => val.split(','),
        },
        {
            name: '--max-workers <number>',
            description: 'Specifies the maximum number of workers the worker-pool ' +
                'will spawn for transforming files. This defaults to the number of the ' +
                'cores available on your machine.',
            parse: (workers) => Number(workers),
        },
        {
            name: '--transformer <string>',
            description: 'Specify a custom transformer to be used',
        },
        {
            name: '--reset-cache, --resetCache',
            description: 'Removes cached files',
        },
        {
            name: '--custom-log-reporter-path, --customLogReporterPath <string>',
            description: 'Path to a JavaScript file that exports a log reporter as a replacement for TerminalReporter',
        },
        {
            name: '--https',
            description: 'Enables https connections to the server',
        },
        {
            name: '--key <path>',
            description: 'Path to custom SSL key',
        },
        {
            name: '--cert <path>',
            description: 'Path to custom SSL cert',
        },
        {
            name: '--config <string>',
            description: 'Path to the CLI configuration file',
            parse: (val) => path.resolve(val),
        },
        {
            name: '--no-interactive',
            description: 'Disables interactive mode',
        },
    ],
};
exports.command = startCommand;
