const chalk = require("chalk");
const fs = require("fs")
const path = require("path");
const http = require("http");
const { EventEmitter } = require("events")
const archiver = require("archiver")
const cli_tools = require("@react-native-community/cli-tools");

async function publishBundle(ctx, args) {
    const config = await getConfig(ctx)
    const metaJson = require(path.join(config.localDir, "meta.json"))
    const pushFile = new PushFile({
        host: config.remote.host,
        port: config.remote.port,
        localDir: config.localDir,
    }, {
        "bundleName": metaJson.name,
        "bundleVersion": metaJson.version,
        "bundleDesc": metaJson.description,
        "bundleBuildTime": metaJson.buildTime
    })
    pushFile.addListener("writeInRequestEnd", (e) => {
        cli_tools.logger.info("文件写入请求完成", "文件大小" + (e / Math.pow(1024, 2)).toFixed(2) + "mb")
    })
    pushFile.addListener("responseEnd", (data) => {
        cli_tools.logger.success("response", JSON.stringify(data, null, 4))
    })
    pushFile.addListener("responseError", (data) => {
        cli_tools.logger.error("responseError", JSON.stringify(data, null, 4))
    })
    pushFile.addListener("requestError", (err) => {
        cli_tools.logger.error("请求出错", err)
    })
    pushFile.publish()
}


function getConfig(ctx) {
    return new Promise((resolve, reject) => {
        const configFilePath = path.join(ctx.root, 'publish.config.js')
        if (fs.existsSync(configFilePath)) {
            const configFunc = require(configFilePath)
            const config = configFunc()
            if (checkRemoteAndProject(ctx, config)) {
                resolve(config)
            } else {
                reject("配置项有错误")
            }
        } else {
            reject("配置文件不存在")
        }
    })
}

function checkRemoteAndProject(ctx, config) {
    if (!config.remote) {
        return cli_tools.logger.error("请填写服务器信息")
    }
    if (!config.remote.port) {
        return cli_tools.logger.error("请指定端口")
    }
    if (!config.remote.host) {
        return cli_tools.logger.error("请指定服务器地址")
    }
    if (!config.localDir) {
        return cli_tools.logger.error("请添加本地文件夹")
    }
    config.localDir = path.join(ctx.root, config.localDir)
    if (isEmptyDir(config.localDir)) {
        return cli_tools.logger.error("本地文件夹不存在")
    }
    return config
}


function isEmptyDir(path) {
    try {
        return !fs.readdirSync(path).length
    } catch (error) {
        return true
    }
}


class PushFile extends EventEmitter {

    publishUrl = "/api/publish/push"

    constructor(params, bundleInfo) {
        super()
        this.host = params.host
        this.port = params.port
        this.localDir = params.localDir
        this.bundleInfo = bundleInfo
    }

    push() {
        return new Promise((resolve, reject) => {
            const bundleMetaDataText = encodeURIComponent(JSON.stringify(this.bundleInfo))
            const request = http.request(
                {
                    host: this.host,
                    port: this.port,
                    method: "POST",
                    path: this.publishUrl,
                    headers: {
                        "Content-Type": "application/octet-stream",
                        bundleMetaData: bundleMetaDataText
                    },
                },
                (response) => {
                    response.addListener("data", (data) => {
                        const _data = parseBodyToJson(data)
                        if (response.statusCode === 200) {
                            this.emit('responseEnd', _data)
                            resolve()
                        }
                        if (response.statusCode === 500) {
                            this.emit('responseError', _data)
                            resolve()
                        }
                    })
                }
            );
            request.addListener('error', (error) => {
                this.emit("requestError", error)
                reject()
            })
            const archive = archiver("zip", {
                zlib: { level: 9 },
            });
            // 导入到请求体中
            archive.pipe(request);
            // 导入结束发送请求
            archive.addListener("end", () => {
                request.end(() => {
                    this.emit("writeInRequestEnd", archive.pointer())
                });
            });

            archive.directory(this.localDir, false);

            archive.finalize();
        })
    }
    // 开始
    async publish() {
        await this.push()
    }
}

/**
 * 打印json字符串
 * @param {*} body 
 * @returns 
 */
function parseBodyToJson(body) {
    return JSON.parse(body.toString())
}


module.exports = publishBundle