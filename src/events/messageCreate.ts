import { Events, Message } from 'discord.js';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { levelSystem } from '~/utils/levels';
import { config } from '~/config';

const STAFF_ROLE_ID = config.staffRole;
const PREFIX = config.prefix;

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message: Message, client: IDiscordClient) {
		if (message.author.bot) return;

		// Handle commands in server channels
		if (message.content.startsWith(PREFIX)) {
			const args = message.content.slice(PREFIX.length).trim().split(/ +/);
			const command = args.shift()?.toLowerCase();

			if (!command) return;

			const cmd = client.messageCommands.get(command);
			if (!cmd) return;

			if (cmd.staffOnly && !message.member?.roles.cache.has(STAFF_ROLE_ID)) {
				return message.reply('You do not have permission to run this command.');
			}

			try {
				await cmd.execute(message, client, args);
			} catch (err) {
				console.error(err);
				message.reply('There was an error trying to execute that command.');
			}
		}

		await levelSystem(message, client);
	},
};
