var env =  require('../env');
var Auth0 =  require('auth0-js');
var decodeJwt =  require('jwt-decode');
var Auth0Cordova =  require('@auth0/cordova');

function getAllBySelector(arg) {
    return document.querySelectorAll(arg);
}

function getBySelector(arg) {
    return document.querySelector(arg);
}

function getById(id) {
    return document.getElementById(id);
}

function getAllByClassName(className) {
    return document.getElementsByClassName(className);
}

function App() {
    this.auth0 = new Auth0.Authentication({
        domain: env.domain,
        clientID: env.clientID
    });
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
}

App.prototype.state = {
    authenticated: false,
    accessToken: false,
    currentRoute: '/',
    routes: {
        '/': {
            id: 'loading',
            onMount: function (page) {
                if (this.state.authenticated === true) {
                    return this.redirectTo('/home');
                }
                return this.redirectTo('/login');
            }
        },
        '/login': {
            id: 'login',
            onMount: function (page) {
                if (this.state.authenticated === true) {
                  return this.redirectTo('/home');
                }
                var loginButton = page.querySelector('.btn-login');
                loginButton.addEventListener('click', this.login);
            }
        },
        '/home': {
            id: 'profile',
            onMount: function (page) {
                if (this.state.authenticated === false) {
                  return this.redirectTo('/login');
                }
                var logoutButton = page.querySelector('.btn-logout');
                var profileCodeContainer = page.querySelector('.profile-json');
                logoutButton.addEventListener('click', this.logout);
                this.loadProfile(function (err, profile) {
                    if (err) {
                        profileCodeContainer.textContent = 'Error ' + err.message;
                    }
                    profileCodeContainer.textContent = JSON.stringify(profile, null, 4);
                });
            }
        }
    }
};

App.prototype.run = function (id) {
    this.container = getBySelector(id);
    this.resumeApp();
}

App.prototype.loadProfile = function (cb) {
    this.auth0.userInfo(this.state.accessToken, cb);
}

App.prototype.login = function (e) {
    e.target.disabled = true;

    var client = new Auth0Cordova({
      clientId: env.clientID,
      domain: env.domain,
      packageIdentifier: env.packageIdentifier
    });

    var options = {
      scope: 'openid profile read:msisdn',
      audience: env.audience
      // this will pre-populate the auth0 hosted login page
      // msisdn: "+817012345678"
    };
    var self = this;
    client.authorize(options, function (err, authResult) {
        if (err) {
            console.log(err);
            return e.target.disabled = false;
        }
        localStorage.setItem('access_token', authResult.accessToken);
        self.resumeApp();
    });
}

App.prototype.logout = function (e) {
    localStorage.removeItem('access_token');
    this.resumeApp();
}

App.prototype.redirectTo = function (route) {
    if (!this.state.routes[route]) {
        throw new Error('Unknown route ' + route + '.');
    }
    this.state.currentRoute = route;
    this.render();
}

App.prototype.resumeApp = function () {
    var accessToken = localStorage.getItem('access_token');

    if (accessToken) {
        this.state.authenticated = true;
        this.state.accessToken = accessToken;
    } else {
        this.state.authenticated = false;
        this.state.accessToken = null;
    }

    this.render();
}

App.prototype.render = function () {
    var currRoute = this.state.routes[this.state.currentRoute];
    var currRouteEl = getById(currRoute.id);
    var element = document.importNode(currRouteEl.content, true);
    this.container.innerHTML = '';
    this.container.appendChild(element);
    currRoute.onMount.call(this, this.container);
}

module.exports = App;
