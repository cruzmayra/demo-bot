'use strict'

var tg = require('./telegram-node-bot')(process.env.token)

tg.router.when(['ping'], 'PingController')
tg.router.when (['estoy', 'bien', 'mal'], 'Status')
tg.router.when (['me llamo', 'yo soy', 'soy', 'yo', 'me llaman', 'mi nombre es'], 'Naming')
tg.router.when ([''], 'Greetings')

var owner_name = null
var owner_status = null
tg.controller('Greetings', function ($) {
  if (owner_name) {
    $.sendMessage('Hola ' + owner_name + ', ¿cómo estás?')
  } else {
    $.sendMessage('Hola!! yo soy DemoBot, ¿y tú?')
  }
})

tg.controller('Status', function ($) {
  if ($.args == '') {
    owner_status = $.message.text
  } else {
    owner_status = $.args
  }
  console.log(owner_status)
  if (owner_status == 'bien' || $.message.text == 'bien') {
    $.sendMessage('Me alegro mucho ' + owner_name + "!")
  } else {
    $.sendMessage('Lo siento mucho ' + owner_name + " :(")
  }
})

tg.controller('Naming', function ($) {
  owner_name = $.args
  $.sendMessage('Encantado ' + owner_name + '!')
})

tg.controller('PingController', function ($) {
        tg.for('ping', function () {
                $.sendMessage('pong')
        })
})
