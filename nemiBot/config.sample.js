module.exports = {
  /* The token of your Discord Bot */
  token: '',
  prefix: '!',
  autoDeleteModCommands: true,
  embed: {
    color: '#0091fc', // The default color for the embeds
    footer: 'NemiBot | Discord Bot for Vulpes' // And the default footer for the embeds
  },
  database: {
    yata: {
      user: 'nemibot',
      host: '',
      database: 'yata',
      password: '',
      port: '5432'
    },
    torn: {
      user: 'nemibot',
      host: '',
      database: 'torn',
      password: '',
      port: '5432'
    }
  }
};
