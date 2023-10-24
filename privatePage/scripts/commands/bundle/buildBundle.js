const Server = require("metro/src/Server");
const bundle = require("metro/src/shared/output/bundle");
const path = require("path");
const chalk = require("chalk");
const saveAssets = require("./saveAssets");
const loadMetroConfig = require("../../utils/loadMetroConfig");
const cli_tools = require("@react-native-community/cli-tools");
const saveMetaData = require("./saveMetaData");
const fs = require("fs");

const bundleImpl = bundle;
async function buildBundle(ctx, args) {
    const config = await loadMetroConfig(ctx, {
        maxWorkers: args.maxWorkers,
        resetCache: args.resetCache,
        config: args.config,
    });
    return buildBundleWithConfig(args, config);
}

async function buildBundleWithConfig(args, config) {
    if (config.resolver.platforms.indexOf(args.platform) === -1) {
        cli_tools.logger.error(`Invalid platform ${args.platform ? `"${chalk.bold(args.platform)}" ` : ''}selected.`);
        cli_tools.logger.info(`Available platforms are: ${config.resolver.platforms
            .map(x => `"${chalk.bold(x)}"`)
            .join(', ')}. If you are trying to bundle for an out-of-tree platform, it may not be installed.`);
        throw new Error('Bundling failed');
    }
    // This is used by a bazillion of npm modules we don't control so we don't
    // have other choice than defining it as an env variable here.
    process.env.NODE_ENV = args.dev ? 'development' : 'production';
    let sourceMapUrl = args.sourcemapOutput;
    if (sourceMapUrl != null && !args.sourcemapUseAbsolutePath) {
        sourceMapUrl = path.basename(sourceMapUrl);
    }
    const requestOpts = {
        entryFile: args.entryFile,
        sourceMapUrl,
        dev: args.dev,
        minify: args.minify !== undefined ? args.minify : !args.dev,
        platform: args.platform,
    };
    const server = new Server(config);
    try {
        const outputDir = path.join(config.projectRoot, args.outputDir)
        const bundleDir = path.join(outputDir, "bundle")
        if (fs.existsSync(outputDir)) {
            fs.rmSync(outputDir, { recursive: true, force: true })
        }
        fs.mkdirSync(bundleDir, { recursive: true })

        const bundle = await bundleImpl.build(server, requestOpts);
        await bundleImpl.save(bundle, {
            ...args,
            bundleOutput: path.join(bundleDir, args.bundleFile)
        }, cli_tools.logger.info);

        const outputAssets = await server.getAssets({
            ...Server.DEFAULT_BUNDLE_OPTIONS,
            ...requestOpts,
            bundleType: 'todo',
        });
        await saveAssets(outputAssets, args.platform, bundleDir, args.assetCatalogDest);

        return await saveMetaData(config, outputDir);
    }
    finally {
        server.end();
    }
}

module.exports = buildBundle;
