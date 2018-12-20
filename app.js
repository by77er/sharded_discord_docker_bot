const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const discord = require('discord.js');

// https://discord.js.org/#/docs/main/stable/general/welcome

const shard_num = numCPUs;

if (cluster.isMaster) {
    if (process.env["DTOKEN"] == undefined) {
        console.error("Please set the DTOKEN environment variable!");
        process.exit(0);
    }
    console.log(`Master (pid ${process.pid}) is running`);
    console.log(`Launching ${shard_num} shards over ${numCPUs} cores`);
    var workers = {};
    for (var i = 0; i < shard_num; i++) {
        setTimeout(function (i) { // conservative rate limiting
            var shard_env = {}; // passing shard info
            shard_env["id"] = i;
            shard_env["total"] = shard_num;

            var worker = cluster.fork(shard_env);

            workers[worker.process.pid] = i; // store for master's use
        }, 5000 * i, i);
    }

    cluster.on('exit', (worker, code, signal) => {
        let num = workers[worker.process.pid]; // save
        delete workers[worker.process.pid]; // delete prev entry
        console.log(`Shard ${num} \t: died with signal ${code} - relaunching`);

        let shard_env = {}; // passing shard info
        shard_env["id"] = num;
        shard_env["total"] = shard_num;
        let new_worker = cluster.fork(shard_env); // create a replacement

        workers[new_worker.process.pid] = num; // update master

    });
} else {
    console.log(`Shard ${process.env["id"]} \t: starting - total shards: ${process.env["total"]}`);
    rundiscord();
}

function rundiscord() {
    console.log(`Shard ${process.env["id"]} \t: connecting to discord`);
    var opts = {
        "shardId": Number(process.env["id"]),
        "shardCount": shard_num
    };
    const client = new discord.Client(opts);
    
    client.on('ready', () => {
        console.log(`Shard ${process.env["id"]} \t: logged in as ${client.user.tag}`);
        console.log(`Shard ${process.env["id"]} \t: serving ${client.guilds.array().length} guild(s)`);
        client.user.setPresence({ game: { name: `Shard ${process.env["id"]} of ${shard_num}` } }).catch(console.error);
    });

    let presence_flop = true;
    client.setInterval(()=>{
        if (presence_flop === true) {
            client.user.setPresence({ game: { name: `Shard ${process.env["id"]} of ${shard_num}` } }).catch(console.error);
        } else {
            client.user.setPresence({ game: { name: 'Hello from spikeland!' } }).catch(console.error);
        }
        presence_flop = !presence_flop;
    }, 30000); // change status every 30s

    client.on('warn', str => {
        console.error(`Shard ${process.env["id"]} \t: ` + str);
    });

    client.on('rateLimit', () => {
        console.error(`Shard ${process.env["id"]} \t: is hitting the rate limit`)
    });

    client.on('guildCreate', guild => {
        console.log(`Shard ${process.env["id"]} \t: joined guild "${guild.name}" | large: ${guild.large}`);
        guild.systemChannel.send("Heyo.").catch(console.error);;
    });

    client.on('guildDelete', guild => {
        console.log(`Shard ${process.env["id"]} \t: left guild "${guild.name}" | large: ${guild.large}`);
    })

    client.on('message', msg => {
        if (msg.content === '// ping') {
            msg.reply(`pong from shard ${process.env["id"]}`).catch(console.error);
        } else if (msg.content === '// kill') {
            msg.channel.send('goodbye').then(()=>{
                process.exit(0);
            }).catch(console.error);;
        }
    });

    client.login(process.env['DTOKEN']);
}
