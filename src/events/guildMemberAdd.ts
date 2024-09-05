import { EmbedBuilder, Events, TextChannel } from 'discord.js';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { AppDB } from '~/classes/AppDB';
import { readDataFile, replaceData } from '~/utils/data';
import { config } from '~/config';

const db = AppDB.getInstance();

module.exports = {
	name: Events.GuildMemberAdd,
	once: false,
	async execute(member: any, client: IDiscordClient) {
		const discordId = member.id.toString();

		const user = await db.query`SELECT * FROM Users WHERE id = ${discordId}`;

		if (!user.length) {
			await db.query`INSERT INTO Users (id, xp, level) VALUES (${discordId}, 0, 0)`;
			console.log(`New user created: ${discordId}`);
		}

		const channel = client.channels.cache.get(
			config.welcomer.channelId,
		) as TextChannel;

		if (channel) {
			channel.send(`<@${discordId}> has joined the server!`);
		}

		if (member.user.bot) return;

		const welcomeMessage = await readDataFile('welcome.md');

		const message = replaceData(welcomeMessage, {
			username: `<@!${discordId}>`,
			guildName: member.guild.name,
			botName: `Vylet`,
			rulesChannel: `<#${config.welcomer.rulesChannel}>`,
		});

		try {
			member.send(message);
		} catch (err) {
			console.error(err);
		}
	},
};
