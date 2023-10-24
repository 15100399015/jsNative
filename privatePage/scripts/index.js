const cliConfig = require("@react-native-community/cli-config");
const cliTools = require("@react-native-community/cli-tools");
const chalk = require("chalk");
const child_process = require("child_process");
const commander = require("commander");
const path = require("path");
const commands = require("./commands");

const program = new commander.Command()
    .usage('[command] [options]')
    .version("0.1.0")
    .option('--verbose', 'Increase logging verbosity');

const handleError = err => {
    cliTools.logger.enable();
    if (program.opts().verbose) {
        cliTools.logger.error(err.message);
    } else {
        const message = err.message.replace(/\.$/, '');
        cliTools.logger.error(`${message}.`);
    }
    if (err.stack) {
        cliTools.logger.log(err.stack);
    }
    if (!program.opts().verbose && cliTools.logger.hasDebugMessages()) {
        cliTools.logger.info(chalk.dim(`Run CLI with ${chalk.reset('--verbose')} ${chalk.dim('flag for more details.')}`));
    }
    process.exit(1);
};

function printExamples(examples) {
    let output = [];
    if (examples && examples.length > 0) {
        const formattedUsage = examples.map(example => `  ${example.desc}: \n  ${chalk.cyan(example.cmd)}`).join('\n\n');
        output = output.concat([chalk.bold('\nExample usage:'), formattedUsage]);
    }
    return output.join('\n').concat('\n');
}

function attachCommand(command, config) {
    // 定义命令
    const cmd = program.command(command.name).action(async function handleAction() {
        const passedOptions = this.opts();
        try {
            await command.func(config, passedOptions);
        } catch (error) {
            handleError(error);
        }
    });


    if (command.description) {
        cmd.description(command.description);
    }

    cmd.addHelpText('after', printExamples(command.examples));

    // 定义命令的选项
    for (const opt of command.options || []) {
        cmd.option(
            opt.name, // 参数名
            opt.description ?? '', // 参数描述
            opt.parse || (val => val), // 转换方法
            typeof opt.default === 'function' ? opt.default(config) : opt.default // 默认值
        );
    }
}

async function setupAndRun() {
    if (process.argv.includes('config')) {
        cliTools.logger.disable();
    }
    cliTools.logger.setVerbose(process.argv.includes('--verbose'));

    if (process.platform !== 'win32') {
        const scriptName = 'setup_env.sh';
        const absolutePath = path.join(__dirname, scriptName);
        try {
            child_process.execFileSync(absolutePath, {
                stdio: 'pipe'
            });
        } catch (error) {
            cliTools.logger.warn(`Failed to run environment setup script "${scriptName}"\n\n${chalk.red(error)}`);
            cliTools.logger.info(`React Native CLI will continue to run if your local environment matches what React Native expects. If it does fail, check out "${absolutePath}" and adjust your environment to match it.`);
        }
    }
    let config = cliConfig.default();
    cliTools.logger.enable();
    for (const command of [...commands.projectCommands]) {
        attachCommand(command, config);
    }
    program.parse(process.argv);
}

async function run() {
    try {
        await setupAndRun();
    } catch (e) {
        handleError(e);
    }
}

exports.run = run