import { REST, Routes } from 'discord.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';

export const deployCommands = async () => {
	const commands = [];
	config();
	const token = process.env.DISCORD_BOT_TOKEN;
	const clientId = process.env.DISCORD_CLIENT_ID;
	const guildId = process.env.DISCORD_GUILD_ID;

	if (!token || !clientId || !guildId) {
		console.error(
			'Missing environment variables [DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID]',
		);
		process.exit(1);
	}

	const folderPath = join(__dirname, 'commands', 'Slash');
	const commandFolders = readdirSync(folderPath);

	for (const folder of commandFolders) {
		const commandsPath = join(folderPath, folder);
		const commandFiles = readdirSync(commandsPath).filter(
			(file) => file.endsWith('.js') || file.endsWith('.ts'),
		); /** Allow for DEBUG and PRODUCTION */

		for (const file of commandFiles) {
			const path = join(commandsPath, file);
			const { command } = require(path);

			commands.push(command.data.toJSON());
		}
	}
	const rest = new REST({ version: '10' }).setToken(token);
	try {
		console.log(
			`Started refreshing application (/) commands. (${commands.length})`,
		);

		await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
			body: commands,
		});

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};

(async () => {
	await deployCommands();
})();
