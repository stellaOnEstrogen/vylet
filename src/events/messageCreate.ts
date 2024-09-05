import { ChannelType, Events, Message, TextChannel } from 'discord.js';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { xpToNextLevel, calculate, levelSystem } from '~/utils/levels';

const STAFF_ROLE_ID = '1280691527688912996'; // Staff role ID
const PREFIX = '!';
const TICKET_CATEGORY_ID = '1281270443235479706'; // Ticket category ID
const GUILD_ID = '1280689379689631794'; // Guild ID

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
