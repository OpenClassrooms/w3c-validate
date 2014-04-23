var conf,
    funcList = [],
    yaml = require('js-yaml'),
    fs = require('fs'),
    w3cjs = require('w3cjs'),
    async = require('async'),
    handlebars = require('handlebars'),
    _ = require('lodash'),
    moment = require('moment'),
    HTTPClient = require('./lib/HTTPClient');

conf = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));


function getFunc (url, client) {
    return function (callback) {
        var results,
            options = {
                output: 'json', // Defaults to 'json', other option includes html
                doctype: 'HTML5', // Defaults false for autodetect
                charset: 'utf-8', // Defaults false for autodetect
                callback: function (res) {
                    res.url = url;
                    res.membershipType = client.type;


                    console.log(url);

                    callback(null, res);
                }
            };

        client.get(url, function (error, response, body) {
            options.input = body;
            results = w3cjs.validate(options);
        });
        
    }
}

function getClients (baseUrl, confLogin, mainCallback) {
    var clients = [],
        funcs = [],
        getFunc = function (client) {
            return function (callback) {
                client.login(callback);
            }
        }

    // console.log(confLogin);

    clients.push(new HTTPClient(baseUrl));

    _(confLogin.users).forEach(function (membershipconf, membershipType) {
        var client;

        membershipconf.type = membershipType;
        client = new HTTPClient(baseUrl, membershipconf, confLogin.uri);
        clients.push(client);
    });

    // prepare parallel call
    clients.forEach(function (client) {
        funcs.push(getFunc(client));
    });

    async.parallel(funcs,
        function (err){
            mainCallback(err, clients);
        }
    );
};

function parseResults (data) {
    var results = {};

    _.forEach(data, function (msg, n) {
        
        msg.url = msg.url.replace(conf.baseUrl, '');

        if (!results[msg.url]) {
            results[msg.url] = {
                hasError: null,
                validate: []
            };
        }

        delete(msg.source);
        delete(msg.context);

        if (!msg.messages) {
            console.log('/!\\ suspicious error...');
            msg.messages = [];
            msg.suspiciousError = true;
        }

        msg.messagesAmount = msg.messages.length;
        msg.icon = conf.icons[msg.membershipType];
        msg.color = msg.messages.length > 0 ? 'danger' : 'success';

        if (results[msg.url].hasError === null && msg.messagesAmount > 0) {
            results[msg.url].hasError = true;
        }

        results[msg.url].validate.push(msg);
        results[msg.url].linkTo = conf.baseUrl + msg.url;
    });

    return results;
}

var template = fs.readFileSync('./templates/' + conf.template + '.html');
template = handlebars.compile(template.toString());

// log in all the clients
getClients(conf.baseUrl, (conf.login || {}), function (err, clients) {

    // prepare each functions for parrallel requests, for each membership types
    clients.forEach(function (client) {
        conf.url.forEach(function (page) {
            var url = conf.baseUrl + page,
                func = getFunc(url, client);

            funcList.push(func);
        });
    });

    // do the requests in parrallel
    async.parallelLimit(funcList, conf.concurrentRequests,
        function(err, results){
            results = parseResults(results);
            var html = template({ results: results, baseUrl: conf.baseUrl, date: moment().format("YYYY-MM-DD HH:mm Z") });
            fs.writeFileSync(conf.export, html);
        }
    );
});
