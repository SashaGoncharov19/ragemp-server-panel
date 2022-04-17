const Discord = require("discord.js");
const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES"]});

const {spawn, exec} = require('child_process');
const fs = require("fs");

const prefix = 'server! ';
const token = 'token_here';

const startServer = __dirname + '\\start.bat';
const startDebug = 'debug.bat';

let status = false;
let mainProcess;

setInterval(() => {
    isLaunched('ragemp-server.exe', (response) => {
        status = !!response;
    })
}, 1000)

setInterval(() => {
    if (status) return client.user.setActivity('Сервер включен.')
    else return client.user.setActivity('Сервер выключен.')
}, 30000)

const isLaunched = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate',  (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'start') {
        mainProcess = spawn(startServer, {detached: true});

        setTimeout(() => {
            isLaunched('ragemp-server.exe', (response) => {
                if (response) message.reply('Сервер успешно запущен!');
                else message.reply('Сервер крашнулся!')
            })
        }, 2000)
    }

    if (command === 'status') {
        if (status) return message.reply('Сервер онлайн.')
        else return message.reply('Сервер выключен.')
    }

    if (command === 'stop') {
        isLaunched('ragemp-server.exe', async (response) => {
            if (!response) return message.reply('Сервер не запущен.');
            exec('taskkill /im ragemp-server.exe');
            message.reply('Сервер выключен.');
        })
    }

    if (command === 'restart') {
        isLaunched('ragemp-server.exe', (response) => {
            if (!response) {
                mainProcess = spawn(startServer, {detached: true});
                return message.reply('Сервер включился и запущен.')
            } else {
                exec('taskkill /im ragemp-server.exe');
                message.reply('Выключаю сервер.')

                setTimeout(() => {
                    message.reply('Запускаю сервер..')
                    mainProcess = spawn(startServer, {detached: true});
                    setTimeout(() => {
                        isLaunched('ragemp-server.exe', (response) => {
                            if (response) return message.reply('Сервер успешно запущен.')
                            else return message.reply('Сервер не запущен, обратитесь к разработчикам за детальной информацией.')
                        })
                    }, 3000)
                }, 3000)
            }
            exec('taskkill /im ragemp-server.exe');
            message.reply('Сервер выключен.');
        })
    }

    if (command === 'debug') {
        exec('ragemp-server.exe > debug.log');

        setTimeout(() => {
            isLaunched('ragemp-server.exe', (response) => {
                if (response) message.reply('Сервер успешно запущен!');
                else message.reply('Сервер крашнулся!')
            })
        }, 2000)
    }

    if (command === 'log') {
        fs.readFile('debug.log', 'utf8', function(err, contents) {
            message.reply('```' + contents + '```')
        });
    }
})

client.login(token);