const
	WebSocket = require('ws'),
	Server = require('./src/server'),
	url = require('url');

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, kctrl) => {
	['change', 'stimulate'].forEach(event => {
		kctrl.on(event, data => ws.send(JSON.stringify({ event: event, data: data })));
	});

	ws.on('message', message => {
		let prop, value;
		[prop, value] = message.split(' ', 2);

		if (value !== undefined) {
			value = JSON.parse(value);
		}

		if (!(prop in kctrl)) {
			ws.send('error');
			return;
		}

		kctrl[prop](value);
	});
});

new Server({
	upgrader: (request, socket, head, kctrl) => {
		const pathname = url.parse(request.url).pathname;

		if (pathname === '/ws') {
			wss.handleUpgrade(request, socket, head, (ws) => {
				wss.emit('connection', ws, kctrl);
			});
		} else {
			socket.destroy();
		}
	}
}).start();
