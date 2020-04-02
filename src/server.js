'use strict';

const
	fs = require('fs'),
	path = require('path'),
	kittens = require('./kittens'),
	http = require('http');

const page = fs.readFileSync(path.resolve(__dirname, '../static/index.html'));

const defaults = {
	hostname: '127.0.0.1',
	port: 5177,
	upgrader: undefined
};

const Server = function(options) {
	options = Object.assign({}, defaults, options);

	var kctrl;

	const server = http.createServer((req, res) => {
		try {
			let body = '';

			req.on('data', chunk => {
				body += chunk.toString();
			});

			req.on('end', () => {
				if (req.method == 'GET' && req.url == '/') {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'text/html; charset=utf8');
					res.end(page);
				} else {
					var
						prop = req.url.substring(1),
						value;

					if (req.method == 'POST' && body != '') {
						value = JSON.parse(body);
					}

					switch (prop) {
						case 'adjIntensity':
						case 'adjInterval':
						case 'interval':
						case 'intensity':
						case 'toggle':
							res.statusCode = 200;
							res.end(JSON.stringify(kctrl[prop](value)));
							return;
					}
				}

				res.statusCode = 404;
				res.end();
			});
		} catch (e) {
			res.statusCode = 500;
			res.end(e.message);
		}
	});

	if (options.upgrader !== undefined) {
		server.on('upgrade', (request, socket, head) => {
			options.upgrader(request, socket, head, kctrl);
		});
	}

	this.start = () => {
		kctrl = new kittens.Controller();

		server.listen(options.port, options.hostname, () => {
			console.log(`Server running at http://${options.hostname}:${options.port}/`);
		});
	};

	this.error = (res, msg) => {
		res.statusCode = 500;
		res.end(JSON.stringify({ error: msg }));
	};
};

module.exports = Server;
