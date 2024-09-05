import { Message, TextChannel } from 'discord.js';
import IDiscordClient from '~/interfaces/IDiscordClient';

const xpToNextLevel = (level: number) => Math.pow(level + 1, 2) * 100;
const xpGain = Math.floor(Math.random() * 16) + 10;

async function levelSystem(message: Message, client: IDiscordClient) {
	const discordId = message.author.id.toString();

	console.log(`XP gain for ${discordId}: ${xpGain}`);

	const user = await client.db.queryRaw('SELECT * FROM Users WHERE id = ?', [
		discordId,
	]);

	if (!user.length) {
		await client.db.queryRaw(
			'INSERT INTO Users (id, xp, level) VALUES (?, ?, ?)',
			[discordId, xpGain, 0],
		);
		console.log(`New user created: ${discordId}`);
	} else {
		const currentUser = user[0];
		const newXP = currentUser.xp + xpGain;
		let newLevel = currentUser.level;

		const channel = client.channels.cache.get(
			client.config.channels.level_ups,
		) as TextChannel;

		if (newXP >= xpToNextLevel(newLevel + 1)) {
			newLevel += 1;
			await channel.send(
				`Congratulations, <@${discordId}>! You've reached level ${newLevel}!\nYou need ${xpToNextLevel(newLevel + 1) - newXP} more XP to reach the next level.`,
			);
		}

		await client.db.queryRaw(
			'UPDATE Users SET xp = ?, level = ?, updated_at = CURRENT_TIMESTAMP, last_level_up = CURRENT_TIMESTAMP WHERE id = ?',
			[newXP, newLevel, discordId],
		);
	}
}

function calculate(xp: number): number {
	const xpToNextLevel = (level: number) => Math.pow(level + 1, 2) * 100;
	const currentLevel = Math.floor(Math.sqrt(xp / 100));
	const xpRequiredForNextLevel = xpToNextLevel(currentLevel + 1) - xp;
	const xpGainPerMessage = Math.floor(Math.random() * 16) + 10;
	const messagesNeeded = Math.ceil(xpRequiredForNextLevel / xpGainPerMessage);

	return messagesNeeded;
}

export { levelSystem, calculate, xpToNextLevel, xpGain };
