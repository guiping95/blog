var Db = require('mongodb').Db,
    settings = require('../settiings'),
    Server = require('mongodb').Server,
    Connection = require('mongodb').Connection;
module.exports = new Db(settings.db, new Server(settings.host, settings.port),
    {safe: true});