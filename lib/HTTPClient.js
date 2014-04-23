var HTTPClient = function (baseUrl, loginConf, loginUri) {
    this.baseUrl = baseUrl;
    this.loginConf = loginConf;
    this.loginUri = loginUri;

    this.type = loginConf ? loginConf.type : 'visitor';
    this.ready = !(loginConf && loginUri);
    this.req = require('request');
    this.jar = this.req.jar();
}

HTTPClient.prototype.login = function (callback) {
    var self = this;

    if (!this.ready) {
        this.request(this.baseUrl, null, function (error, response, body) {

            if (!error && response.statusCode == 200) {
                self.post(self.baseUrl + self.loginUri, {
                    form: self.getAuth()
                }, function (error, response, body) {
                    self.ready = true;
                    callback();
                });
            }
        });
    } else {
        callback();
    }
}

HTTPClient.prototype.getAuth = function () {
    return this.loginConf;
}

HTTPClient.prototype.request = function (url, options, callback) {
    if (!options) {
        options = {};
    }

    options.jar = this.jar;

    if (url.charAt(0) === '/') {
        url = HTTPClient.BASEURL + url;
    }

    this.req(url, options, callback);

}

HTTPClient.prototype.post = function (url, options, callback) {
    if (!options) {
        options = {};
    }

    options.method = 'POST';
    options.followRedirect = true,
    options.followAllRedirects = true;

    this.request(url, options, callback);
}

HTTPClient.prototype.get = function (url, options, callback) {
    var self = this;

    if (!this.ready) {

        this.login(function () {
            self.request(url, options, callback);
        });
    } else {
        this.request(url, options, callback);
    }
}

module.exports = HTTPClient;
