const cli_tools = require("@react-native-community/cli-tools");
const fs = require("fs");
const path = require("path");
const filterPlatformAssetScales = require("./filterPlatformAssetScales");
const getAssetDestPath = require("./getAssetDestPathAndroid");

async function saveAssets(assets, platform, assetsDest, assetCatalogDest) {
    if (assetsDest == null) {
        cli_tools.logger.warn('Assets destination folder is not set, skipping...');
        return;
    }
    const filesToCopy = {};
    const addAssetToCopy = (asset) => {
        const validScales = new Set(filterPlatformAssetScales(platform, asset.scales));
        asset.scales.forEach((scale, idx) => {
            if (!validScales.has(scale)) {
                return;
            }
            const src = asset.files[idx];
            const dest = path.join(assetsDest, getAssetDestPath(asset, scale));
            filesToCopy[src] = dest;
        });
    };
    assets.forEach(addAssetToCopy);
    return copyAll(filesToCopy);
}

function copyAll(filesToCopy) {
    const queue = Object.keys(filesToCopy);
    if (queue.length === 0) {
        return Promise.resolve();
    }
    cli_tools.logger.info(`Copying ${queue.length} asset files`);
    return new Promise((resolve, reject) => {
        const copyNext = (error) => {
            if (error) {
                reject(error);
                return;
            }
            if (queue.length === 0) {
                cli_tools.logger.info('Done copying assets');
                resolve();
            }
            else {
                // queue.length === 0 is checked in previous branch, so this is string
                const src = queue.shift();
                const dest = filesToCopy[src];
                copy(src, dest, copyNext);
            }
        };
        copyNext();
    });
}

function copy(src, dest, callback) {
    const destDir = path.dirname(dest);
    fs.mkdir(destDir, { recursive: true }, (err) => {
        if (err) {
            callback(err);
            return;
        }
        fs.createReadStream(src)
            .pipe(fs.createWriteStream(dest))
            .on('finish', callback);
    });
}

module.exports = saveAssets;
