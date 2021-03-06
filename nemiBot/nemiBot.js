const { Intents } = require('discord.js');
require('./helpers/extenders');
const util = require('util');
const fs = require('fs');
const readdir = util.promisify(fs.readdir);

// Load nemiBot class
const NemiBot = require('./base/nemiBot.js');
const client = new NemiBot({
  intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER']
});

const init = async () => {
  // Search for all commands
  const directories = await readdir('./commands/');
  client.logger.log(`Loading a total of ${directories.length} categories.`, 'log');
  directories.forEach(async (dir) => {
    const commands = await readdir('./commands/' + dir + '/');
    commands.filter((cmd) => cmd.split('.').pop() === 'js').forEach((cmd) => {
      const response = client.loadCommand('./commands/' + dir, cmd);
      if (response) {
        client.logger.log(response, 'error');
      }
    });
  });

  // Then we load events, which will include our message and ready event.
  const evtFiles = await readdir('./events/');
  client.logger.log(`Loading a total of ${evtFiles.length} events.`, 'log');
  evtFiles.forEach((file) => {
    const eventName = file.split('.')[0];
    client.logger.log(`Loading Event: ${eventName}`);
    const event = new (require(`./events/${file}`))(client);
    client.on(eventName, (...args) => event.run(...args));
    delete require.cache[require.resolve(`./events/${file}`)];
  });

  client.login(client.config.token); // Log in to the discord api

  const autoUpdateDocs = require('./helpers/autoUpdateDocs.js');
  autoUpdateDocs.update(client);
};

init();

// if there are errors, log them
client.on('disconnect', () => client.logger.log('Bot is disconnecting...', 'warn'))
  .on('reconnecting', () => client.logger.log('Bot reconnecting...', 'log'))
  .on('error', (e) => client.logger.log(e, 'error'))
  .on('warn', (info) => client.logger.log(info, 'warn'));

// if there is an unhandledRejection, log them
process.on('unhandledRejection', (err) => {
  console.error(err);
});
