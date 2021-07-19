const functions = require('../helpers/functions.js');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run () {
    const client = this.client;

    try {
      setInterval(async function () {
        await functions.checkNpc(client);
        await functions.checkOC(client);
      }, 10000); // Every 30 seconds
    } catch (err) {
      this.client.logger.log(err, 'error');
    }

    try {
      setInterval(async function () {
        await functions.checkChain(client);
      }, 10000); // Every 10 seconds
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
};
