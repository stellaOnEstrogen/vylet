import { Collection, Client, GatewayIntentBits } from 'discord.js';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AppDB } from '~/classes/AppDB';
import { config as dotenv } from 'dotenv';
import { startHttpServer } from './web/server';

dotenv(); // Load environment variables first
const token = process.env.DISCORD_BOT_TOKEN;

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
	],
	allowedMentions: {
		parse: ['everyone', 'roles', 'users'],
		repliedUser: true,
	},
}) as IDiscordClient;

client.slashCommands = new Collection();
client.messageCommands = new Collection();
client.db = AppDB.getInstance();
client.config = {
	Activities: [
		{
			name: '⭐ me on github!',
			type: 'LISTENING',
		},
		{
			name: '🌟 with the stars',
			type: 'PLAYING',
		},
		{
			name: '/help for help',
			type: 'CUSTOM',
		},
		{
			name: '<3 from Stella',
			type: 'CUSTOM',
		},
	],
	channels: {
		events: '1280692262992478290',
		giveaways: '1280692241047752788',
		level_ups: '1280692285570289785',
		polls: '1280692268738674729',
		self_roles: '1280692257170915380',
	},
};

async function loadCommands() {
	const slashCommandsPath = join(__dirname, 'commands', 'Slash');
	const messageCommandsPath = join(__dirname, 'commands', 'Message');
	const eventsPath = join(__dirname, 'events');

	const loadFiles = (path: string, collection: Collection<any, any>) => {
		const files = readdirSync(path);

		for (const file of files) {
			const filePath = join(path, file);
			const stats = statSync(filePath);

			if (stats.isDirectory()) {
				loadFiles(filePath, collection);
			} else if (file.endsWith('.js') || file.endsWith('.ts')) {
				const command = require(filePath);

				if (command.command.data) {
					collection.set(command.command.data.name, command.command);
				} else {
					collection.set(command.command.name, command.command);
				}
			}
		}
	};

	loadFiles(slashCommandsPath, client.slashCommands);
	loadFiles(messageCommandsPath, client.messageCommands);

	readdirSync(eventsPath).forEach((file) => {
		const event = require(join(eventsPath, file));
		const handler = (...args: any[]) => event.execute(...args, client);
		if (event.once) {
			client.once(event.name, handler);
		} else {
			client.on(event.name, handler);
		}
	});
}

(async () => {
	try {
		await loadCommands();
		await client.login(token);
		startHttpServer();
	} catch (error) {
		console.error('Error starting bot:', error);
	}
})();
