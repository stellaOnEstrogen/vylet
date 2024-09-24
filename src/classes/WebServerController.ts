import { Request, Response } from 'express';
import { exec } from 'child_process';

const STEPS = {
    DEPLOY: [
        'git pull',
        'npm i',
        'pm2 restart --name "vylet"',
    ]
}

export class WebServerController {
    private static async deploy(req: Request, res: Response) {
        for (const step of STEPS.DEPLOY) {
            try {
                await execPromise(step);
            } catch (error) {
                console.error(`Error: ${error}`);
                return res.status(500).send('Error deploying');
            }
        }
        return res.status(200).send('Deployed');
    }

    public static async processWebhook(req: Request, res: Response) {
        const githubEvent = req.headers['x-github-event'];
        
        switch (githubEvent) {
            case 'push':
                return this.deploy(req, res);
            default:
                return res.status(400).send('Event not supported');
        }
    }
}

function execPromise(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}
