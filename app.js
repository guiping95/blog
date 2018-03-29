var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var settings = require('./settiings');
var flash = require('connect-flash');
var routes = require('./routes/index');

var app = express();

    app.set('port', process.env.PORT || 3000);
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(flash());

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(cookieParser());
    app.use(session({
        secret: settings.cookieSecret,
        key: settings.db,//cookie name
        store: new MongoStore({
            db: settings.db,
            url: 'mongodb://localhost/blog',
            autoRemove: 'native',
            host: settings.host,
            port: settings.port
        })

    }));

    app.use(express.static(path.join(__dirname, 'public')));

    app.use(function (req, res, next) {
        var err = req.flash('error'),
            success = req.flash('success');
        res.locals.user = req.session.user;
        res.locals.error = err.length ? err : null;
        res.locals.success = success.length ? success : null;
        next();
    });

    routes(app);

    app.listen(app.get('port'), function () {
        console.log('Express server listening on port ' + app.get('port'));
    });

