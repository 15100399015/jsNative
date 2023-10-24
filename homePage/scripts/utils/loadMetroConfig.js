const path = require("path");
const metro_config = require("metro-config");
const cli_tools = require("@react-native-community/cli-tools");
const metroPlatformResolver = require("./metroPlatformResolver");
/**
 * Get the config options to override based on RN CLI inputs.
 */
function getOverrideConfig(ctx) {
    const outOfTreePlatforms = Object.keys(ctx.platforms).filter(platform => ctx.platforms[platform].npmPackageName);
    const resolver = {
        platforms: [...Object.keys(ctx.platforms), 'native'],
    };
    if (outOfTreePlatforms.length) {
        resolver.resolveRequest = metroPlatformResolver.reactNativePlatformResolver(outOfTreePlatforms.reduce((result, platform) => {
            result[platform] = ctx.platforms[platform].npmPackageName;
            return result;
        }, {}));
    }
    return {
        resolver,
        serializer: {
            // We can include multiple copies of InitializeCore here because metro will
            // only add ones that are already part of the bundle
            getModulesRunBeforeMainModule: () => [
                require.resolve(path.join(ctx.reactNativePath, 'Libraries/Core/InitializeCore'), { paths: [ctx.root] }),
                ...outOfTreePlatforms.map(platform => require.resolve(`${ctx.platforms[platform].npmPackageName}/Libraries/Core/InitializeCore`)),
            ],
        },
    };
}
/**
 * Load Metro config.
 *
 * Allows the CLI to override select values in `metro.config.js` based on
 * dynamic user options in `ctx`.
 */
async function loadMetroConfig(ctx, options = {}) {
    const overrideConfig = getOverrideConfig(ctx);
    const cwd = ctx.root;
    const projectConfig = await metro_config.resolveConfig(options.config, cwd);
    if (projectConfig.isEmpty) {
        throw new cli_tools.CLIError(`No Metro config found in ${cwd}`);
    }
    cli_tools.logger.debug(`Reading Metro config from ${projectConfig.filepath}`);
    if (!global.__REACT_NATIVE_METRO_CONFIG_LOADED) {
        const warning = `
=================================================================================================
From React Native 0.73, your project's Metro config should extend '@react-native/metro-config'
or it will fail to build. Please copy the template at:
https://github.com/facebook/react-native/blob/main/packages/react-native/template/metro.config.js
This warning will be removed in future (https://github.com/facebook/metro/issues/1018).
=================================================================================================
    `;
        for (const line of warning.trim().split('\n')) {
            cli_tools.logger.warn(line);
        }
    }
    return metro_config.mergeConfig(await metro_config.loadConfig({
        cwd,
        ...options,
    }), overrideConfig);
}
module.exports = loadMetroConfig;
