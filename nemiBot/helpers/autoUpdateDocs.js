/* THIS CHECK IF THE DOCS NEED TO BE UPDATED */

module.exports = {

  /**
   * Update the doc
   * @param {object} client The Discord Client instance
   */
  update (client) {
    const table = require('text-table');
    const commands = client.commands;
    const categories = [];
    commands.forEach((cmd) => {
      if (!categories.includes(cmd.help.category)) {
        categories.push(cmd.help.category);
      }
    });
    let text = `# Commands  \nHere's the list of NemiBot commands. This one contains more than **${Math.floor(commands.size / 10)}0 commands** in **${categories.length} categories**!  \n\n#### Contents of the table  \n**Name**: The name of the command  \n**Description**: A brief explanation of the purpose of the command  \n**Usage**: The arguments/options that the command takes in parameters  \n**Cooldown**: The time that must elapse between each command so that it can be executed again by the user\n\n`;

    categories.sort(function (a, b) {
      const aCmdsLength = commands.filter((cmd) => cmd.help.category === a).values().length;
      const bCmdsLength = commands.filter((cmd) => cmd.help.category === b).values().length;
      if (aCmdsLength > bCmdsLength) {
        return -1;
      } else {
        return 1;
      }
    }).forEach((cat) => {
      const arrCat = [
        ['Name', 'Description', 'Usage', 'Cooldown']
      ];
      const cmds = Array.from(commands.filter((cmd) => cmd.help.category === cat).values());
      text += `### ${cat} (${cmds.length} commands)\n\n`;
      cmds.sort(function (a, b) {
        if (a.help.name < b.help.name) {
          return -1;
        } else {
          return 1;
        }
      }).forEach((cmd) => {
        arrCat.push([
          `**${cmd.help.name}**`,
          `${cmd.help.category.toLowerCase()}/${cmd.help.name}:DESCRIPTION`,
          `${cmd.help.category.toLowerCase()}/${cmd.help.name}:USAGE`,
          Math.ceil(cmd.conf.cooldown / 1000) + ' seconds'
        ]);
      });
      text += `${table(arrCat)}\n\n`;
    });
    const fs = require('fs');
    if (fs.existsSync('./docs')) {
      fs.writeFileSync('./docs/commands.md', text);
      client.logger.log('Docs updated!');
    }
  }

};
