const chalk = require("chalk");
const metro = require("metro");
const metro_core = require("metro-core");
const path = require("path");
const dev_middleware = require("@react-native/dev-middleware");
const cli_server_api = require("@react-native-community/cli-server-api");
const cli_tools = require("@react-native-community/cli-tools");
const isDevServerRunning = require("../../utils/isDevServerRunning");
const loadMetroConfig = require("../../utils/loadMetroConfig");
const attachKeyHandlers = require("./attachKeyHandlers");


async function runServer(ctx, args) {
    const metroConfig = await loadMetroConfig(ctx, {
        config: args.config,
        maxWorkers: args.maxWorkers,
        port: args.port ?? 8081,
        resetCache: args.resetCache,
        watchFolders: args.watchFolders,
        projectRoot: args.projectRoot,
        sourceExts: args.sourceExts,
    });
    const host = args.host?.length ? args.host : 'localhost';
    const { projectRoot, server: { port }, watchFolders, } = metroConfig;
    const scheme = args.https === true ? 'https' : 'http';
    const devServerUrl = `${scheme}://${host}:${port}`;
    cli_tools.logger.info(`Welcome to React Native v${ctx.reactNativeVersion}`);
    const serverStatus = await isDevServerRunning(scheme, host, port, projectRoot);
    if (serverStatus === 'matched_server_running') {
        cli_tools.logger.info(`A dev server is already running for this project on port ${port}. Exiting.`);
        return;
    }
    else if (serverStatus === 'port_taken') {
        cli_tools.logger.error(`Another process is running on port ${port}. Please terminate this ` +
            'process and try again, or use another port with "--port".');
        return;
    }
    cli_tools.logger.info(`Starting dev server on port ${chalk.bold(String(port))}...`);
    if (args.assetPlugins) {
        // $FlowIgnore[cannot-write] Assigning to readonly property
        metroConfig.transformer.assetPlugins = args.assetPlugins.map(plugin => require.resolve(plugin));
    }
    const { middleware: communityMiddleware, websocketEndpoints: communityWebsocketEndpoints, messageSocketEndpoint, eventsSocketEndpoint, } = cli_server_api.createDevServerMiddleware({
        host,
        port,
        watchFolders,
    });
    const { middleware, websocketEndpoints } = dev_middleware.createDevMiddleware({
        projectRoot,
        serverBaseUrl: devServerUrl,
        logger: cli_tools.logger,
        unstable_experiments: {
            // NOTE: Only affects the /open-debugger endpoint
            enableCustomDebuggerFrontend: true,
        },
    });
    let reportEvent;
    const terminal = new metro_core.Terminal(process.stdout);
    const ReporterImpl = getReporterImpl(args.customLogReporterPath);
    const terminalReporter = new ReporterImpl(terminal);
    const reporter = {
        update(event) {
            terminalReporter.update(event);
            if (reportEvent) {
                reportEvent(event);
            }
            if (args.interactive && event.type === 'initialize_done') {
                cli_tools.logger.info('Dev server ready');
                attachKeyHandlers({
                    cliConfig: ctx,
                    devServerUrl,
                    messageSocket: messageSocketEndpoint,
                });
            }
        },
    };
    // $FlowIgnore[cannot-write] Assigning to readonly property
    metroConfig.reporter = reporter;
    const serverInstance = await metro.runServer(metroConfig, {
        host: args.host,
        secure: args.https,
        secureCert: args.cert,
        secureKey: args.key,
        unstable_extraMiddleware: [
            communityMiddleware,
            cli_server_api.indexPageMiddleware,
            middleware,
        ],
        websocketEndpoints: {
            ...communityWebsocketEndpoints,
            ...websocketEndpoints,
        },
    });
    reportEvent = eventsSocketEndpoint.reportEvent;
    // In Node 8, the default keep-alive for an HTTP connection is 5 seconds. In
    // early versions of Node 8, this was implemented in a buggy way which caused
    // some HTTP responses (like those containing large JS bundles) to be
    // terminated early.
    //
    // As a workaround, arbitrarily increase the keep-alive from 5 to 30 seconds,
    // which should be enough to send even the largest of JS bundles.
    //
    // For more info: https://github.com/nodejs/node/issues/13391
    //
    serverInstance.keepAliveTimeout = 30000;
    await cli_tools.version.logIfUpdateAvailable(ctx.root);
}
function getReporterImpl(customLogReporterPath) {
    if (customLogReporterPath == null) {
        return require('metro/src/lib/TerminalReporter');
    }
    try {
        // First we let require resolve it, so we can require packages in node_modules
        // as expected. eg: require('my-package/reporter');
        // $FlowIgnore[unsupported-syntax]
        return require(customLogReporterPath);
    }
    catch (e) {
        if (e.code !== 'MODULE_NOT_FOUND') {
            throw e;
        }
        // If that doesn't work, then we next try relative to the cwd, eg:
        // require('./reporter');
        // $FlowIgnore[unsupported-syntax]
        return require(path.resolve(customLogReporterPath));
    }
}
module.exports = runServer;
