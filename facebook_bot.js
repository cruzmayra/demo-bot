if (!process.env.page_token) {
    console.log('Error: Specify page_token in environment');
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify verify_token in environment');
    process.exit(1);
}


var Botkit = require('./botkit/lib/Botkit.js');
var os = require('os');

var controller = Botkit.facebookbot({
    debug: true,
    access_token: process.env.page_token,
    verify_token: process.env.verify_token,
});

var bot = controller.spawn({
});

controller.setupWebserver(process.env.port || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
    });
});


controller.hears(['hola'], 'message_received', function(bot, message) {


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hola ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hola, no sé cómo te llamas...');
        }
    });
});


controller.hears(['structured'], 'message_received', function(bot, message) {

    bot.reply(message, {
        attachment: {
            'type': 'template',
            'payload': {
                'template_type': 'generic',
                'elements': [
                    {
                        'title': 'Classic White T-Shirt',
                        'image_url': 'http://petersapparel.parseapp.com/img/item100-thumb.png',
                        'subtitle': 'Soft white cotton t-shirt is back in style',
                        'buttons': [
                            {
                                'type': 'web_url',
                                'url': 'https://petersapparel.parseapp.com/view_item?item_id=100',
                                'title': 'View Item'
                            },
                            {
                                'type': 'web_url',
                                'url': 'https://petersapparel.parseapp.com/buy_item?item_id=100',
                                'title': 'Buy Item'
                            },
                            {
                                'type': 'postback',
                                'title': 'Bookmark Item',
                                'payload': 'White T-Shirt'
                            }
                        ]
                    },
                    {
                        'title': 'Classic Grey T-Shirt',
                        'image_url': 'http://petersapparel.parseapp.com/img/item101-thumb.png',
                        'subtitle': 'Soft gray cotton t-shirt is back in style',
                        'buttons': [
                            {
                                'type': 'web_url',
                                'url': 'https://petersapparel.parseapp.com/view_item?item_id=101',
                                'title': 'View Item'
                            },
                            {
                                'type': 'web_url',
                                'url': 'https://petersapparel.parseapp.com/buy_item?item_id=101',
                                'title': 'Buy Item'
                            },
                            {
                                'type': 'postback',
                                'title': 'Bookmark Item',
                                'payload': 'Grey T-Shirt'
                            }
                        ]
                    }
                ]
            }
        }
    });
});

controller.on('facebook_postback', function(bot, message) {

    bot.reply(message, 'Buena elección!!!! (' + message.payload + ')');

});

controller.hears(['me llamo (.*)', 'llámame (.*)'], 'message_received', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Ok. Te llamará ' + user.name + ' desde ahora.');
        });
    });
});

controller.hears(['cómo me llamo', 'quién soy'], 'message_received', function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Tu nombre es ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('No sé cómo te llamas!');
                    convo.ask('Cómo debería llamarte?', function(response, convo) {
                        convo.ask('Quieres que te llame `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! voy a actualizar mi dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Vale. Te llamaré ' + user.name + ' a partir de ahora.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, olvídalo!');
                        }
                    });
                }
            });
        }
    });
});

controller.on('message_received', function(bot, message) {
    bot.reply(message, 'Prueba: `cuál es mi nombre` or `structured` or `llámame captain`');
    return false;
});
