var nock = require('nock');
var chai = require('chai');
var dirtyChai = require('dirty-chai');
chai.use(dirtyChai);
var expect = chai.expect;

var authorization = require('../authorization');
var config = require('../config');
var mock = require('./mock');

describe("user authorization", function() {

	var profile = {
		id: 12,
		displayName: 'displayName',
		username: 'username',
		emails: [{ value: 'me@gmail.com' }],
		profileUrl: 'https://localhost/users/12',
		_json: {
			login: 'json_login',
			gravatar_id: 'whatever'
		}
	};

	var context = {
		models: { User: mock.MockUser },
		logger: mock.logger
	};

	var strategyCallback = null;

	beforeEach(function () {
		config.apiEndpoint = 'https://api.github.com/';

		strategyCallback = authorization.makeStrategyCallback(context);
	});

	describe("based on organization membership", function () {

		beforeEach(function () {
			config.orgName = "the-org";
			config.accessTeamName = null;
			config.adminTeamName = null;
		});

		it("denies access to users not in the org", function (done) {
			nock('https://api.github.com/')
				.get('/user/memberships/orgs/the-org')
				.reply(404);

			strategyCallback('12345', null, profile, function (err, user) {
				expect(err.message).to.equal('User not authorized');
				expect(user).to.be.undefined();

				done();
			});
		});

		it("grants access to users in the org", function (done) {
			nock('https://api.github.com/')
				.get('/user/memberships/orgs/the-org')
				.reply(200, {
					state: 'active'
				});

			strategyCallback('12345', null, profile, function (err, user) {
				expect(err).to.be.null();
				expect(user.email).to.equal('me@gmail.com');
				expect(user.account_level).to.equal(0);

				done();
			});
		});

		it("grants admin access to owners in the org", function (done) {
			nock('https://api.github.com/')
				.get('/user/memberships/orgs/the-org')
				.reply(200, {
					state: 'active',
					role: 'admin'
				});

			strategyCallback('12345', null, profile, function (err, user) {
				expect(err).to.be.null();
				expect(user.email).to.equal('me@gmail.com');
				expect(user.account_level).to.equal(1);

				done();
			});
		});

	});

	describe("based on team membership", function () {

		it("denies access to users not in the org");

		it("denies access to users in the org but not in either team");

		it("grants access to users in the access team");

		it("grants admin to users in the admin team");

	});

});
