const path = require("path");
const assetPathUtils = require("./assetPathUtils");
function getAssetDestPathAndroid(asset, scale) {
    const androidFolder = assetPathUtils.getAndroidResourceFolderName(asset, scale);
    const fileName = assetPathUtils.getResourceIdentifier(asset);
    return path.join(androidFolder, `${fileName}.${asset.type}`);
}
module.exports = getAssetDestPathAndroid;
