const fs = require("fs");
const path = require("path");
const cli_tools = require("@react-native-community/cli-tools");

async function saveMetaData(config, outputDir) {

    const appJsonFilePath = path.join(config.projectRoot, "app.json");
    const metaDataFilePath = path.join(outputDir, 'meta.json')

    if (fs.existsSync(appJsonFilePath)) {
        const appJson = require(appJsonFilePath)

        const versionUtil = new VersionUtil(appJson.version)
        versionUtil.updateVersion()
        appJson.version = versionUtil.getVersion()

        const metaData = {
            name: appJson.name,
            version: String(appJson.version),
            description: appJson.description,
            buildTime: getCurrentTime(),
        }

        fs.writeFileSync(metaDataFilePath, JSON.stringify(metaData, null, 4))
        fs.writeFileSync(appJsonFilePath, JSON.stringify(appJson, null, 4))
    } else {
        cli_tools.logger.error(`File not found: ${appJsonFilePath}`);
    }

}


function getCurrentTime() {
    const date = new Date();
    return [
        date.getUTCFullYear() + ".",
        date.getUTCMonth() + 1 + ".",
        date.getUTCDay() + 1 + "-",
        date.getHours() + ":",
        date.getUTCMinutes() + ":",
        date.getUTCSeconds()
    ].join("")
}

class VersionUtil {
    versionArray;
    carry = 3
    constructor(version = "0.0.1") {
        const versionArray = version.split(".").map(Number)
        if (versionArray.length !== 3 || versionArray.includes(NaN)) {
            throw new Error("版本错误")
        }
        this.versionArray = versionArray
    }

    getVersion() {
        return this.versionArray.join(".")
    }

    updateVersion() {
        let [largeVersionNum, mediumVersionNum, smallVersionNum] = this.versionArray
        if (String(smallVersionNum + 1).length === this.carry) {
            smallVersionNum = 0
            if (String(mediumVersionNum + 1).length === this.carry) {
                mediumVersionNum = 0
                largeVersionNum += 1
            } else {
                mediumVersionNum += 1
            }
        } else {
            smallVersionNum += 1
        }
        this.versionArray[0] = largeVersionNum
        this.versionArray[1] = mediumVersionNum
        this.versionArray[2] = smallVersionNum
    }
}

module.exports = saveMetaData;
