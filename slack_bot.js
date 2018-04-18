var Botkit = require('botkit')
var dotenv = require('dotenv')
dotenv.config()

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.PORT) {
  console.log('Error: Specify clientId and clientSecret and port in environment')
  process.exit(1)
}

var controller = Botkit.slackbot({
 debug: false,
 json_file_store: './db/',
 clientId: process.env.CLIENT_ID,
 clientSecret: process.env.CLIENT_SECRET,
 scopes: ['bot','commands'],
})

controller.setupWebserver(process.env.PORT, function(err, webserver) {
  controller.createWebhookEndpoints(controller.webserver)
  controller.createOauthEndpoints(controller.webserver, function(err, req, res) {
    if (err) {
      res.status(500).send('ERROR: ' + err)
    } else {
      res.send('Success!')
    }
  })
})

var owner_name = null 
controller.hears(['hola'],['direct_message','direct_mention','mention'],function(bot,message) {
    bot.reply(message,"¿Qué tranza?");
});

controller.hears(['^me[\\s]+llamo[\\s]+(.+)$'],['direct_message','direct_mention','mention'],function(bot,message) {
  if (message.match[1]) {
    owner_name = message.match[1]
    bot.reply(message, "Chido " + owner_name + ", yo soy RefranBot")
  }
});

controller.hears(['^¿cómo estás?'],['direct_message','direct_mention','mention'],function(bot,message) {
  bot.reply(message,"Como cochino recien comprado: desconociendo el mecate.");
});

controller.hears(['attach'],['direct_message','direct_mention'],function(bot,message) {

  var attachments = [];
  var attachment = {
    title: 'This is an attachment',
    color: '#FFCC99',
    fields: [],
  };

  attachment.fields.push({
    label: 'Field',
    value: 'A longish value',
    short: false,
  });

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  });

  attachment.fields.push({
    label: 'Field',
    value: 'Value',
    short: true,
  });

  attachments.push(attachment);

  bot.reply(message,{
    text: 'See below...',
    attachments: attachments,
  },function(err,resp) {
    console.log(err,resp);
  });
});

var connected_teams = {}

trackTeam = function (token) {
  console.log('bot tracked for team\'s token ' + token)
  connected_teams[token] = true
}

checkTeamTracking = function (token) {
  if (connected_teams[token] == true) {
    return true
  } else {
    return false
  }
}

reconnectToTeams = function () {
  controller.storage.teams.all(function(err, teams) {
    if (err) {
      throw new Error(err)
    }
    // connect all teams with bots up to slack!
    teams.forEach(function (team) {
      if (team.bot.token) {
        if (checkTeamTracking(team.bot.token)) {
          //console.log('bot already tracked in team ' + team.id)
          // we check we don't have same team twice on database, because of first times developping.
          //console.log('already connected to team ' + team.id + ". skipping ...")
        } else {
          console.log('connecting bot to team ' + team.id)
          controller.spawn(team).startRTM(function (err, bot, payload) {
            if (err) {
              console.log(err)
            } else {
              trackTeam(team.bot.token)
            }
          })
        }
      } else {
        console.log('undefined team!')
      }
    })
  })
}

setInterval(reconnectToTeams, 5000)
