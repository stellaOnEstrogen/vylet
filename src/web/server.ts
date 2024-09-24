import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { config } from '../config';
import { WebServerController } from '../classes/WebServerController';

const app: Application = express();
const httpServer = createServer(app);

app.get('/', (req: Request, res: Response) => {
	res.send('Hello World');
});

app.get('/gh-webhook', WebServerController.processWebhook);

httpServer.listen(config.webServer.port, config.webServer.host, () => {
	console.log(
		`Server is running on ${config.webServer.host}:${config.webServer.port}`,
	);
});
