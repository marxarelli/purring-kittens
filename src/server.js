'use strict';

const
	fs = require('fs'),
	path = require('path'),
	kittens = require('./kittens'),
	http = require('http');

const page = fs.readFileSync(path.resolve(__dirname, '../static/index.html'));

const Server = function(hostname, port) {
	hostname = hostname || '127.0.0.1';
	port = port || 5177;

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

	this.start = () => {
		kctrl = new kittens.Controller();

		server.listen(port, hostname, () => {
			console.log(`Server running at http://${hostname}:${port}/`);
		});
	};

	this.error = (res, msg) => {
		res.statusCode = 500;
		res.end(JSON.stringify({ error: msg }));
	};
};

module.exports = Server;
