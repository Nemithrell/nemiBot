const cron = require('../helpers/cron.js');

module.exports = class {
  constructor (client) {
    this.client = client;
  }

  async run () {
    const client = this.client;
    try {
      cron.run(client);
    } catch (err) {
      this.client.logger.log(err, 'error');
    }
  }
};
