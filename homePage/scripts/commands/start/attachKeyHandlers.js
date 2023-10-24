const cli_tools = require("@react-native-community/cli-tools");
const chalk = require("chalk");
const node_fetch = require("node-fetch");
const KeyPressHandler = require("../../utils/KeyPressHandler");

const CTRL_C = '\u0003';
const CTRL_D = '\u0004';

function attachKeyHandlers({ cliConfig, devServerUrl, messageSocket, }) {
    if (process.stdin.isTTY !== true) {
        cli_tools.logger.debug('Interactive mode is not supported in this environment');
        return;
    }
    const keyPressHandler = new KeyPressHandler.KeyPressHandler(async (key) => {
        switch (key) {
            case 'r':
                messageSocket.broadcast('reload', null);
                cli_tools.logger.info('Reloading connected app(s)...');
                break;
            case 'd':
                messageSocket.broadcast('devMenu', null);
                cli_tools.logger.info('Opening Dev Menu...');
                break;
            case 'j':
                await node_fetch(devServerUrl + '/open-debugger', { method: 'POST' });
                break;
            case CTRL_C:
            case CTRL_D:
                cli_tools.logger.info('Stopping server');
                keyPressHandler.stopInterceptingKeyStrokes();
                process.emit('SIGINT');
                process.exit();
        }
    });
    keyPressHandler.createInteractionListener();
    keyPressHandler.startInterceptingKeyStrokes();
    cli_tools.logger.log(`
${chalk.bold('d')} - open Dev Menu
${chalk.bold('j')} - open debugger
${chalk.bold('r')} - reload app
    `);
}
module.exports = attachKeyHandlers;
