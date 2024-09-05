import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import ISlashCommand from '~/interfaces/ISlashCommand';
import { calculate, xpToNextLevel } from '~/utils/levels';
import IDiscordClient from '~/interfaces/IDiscordClient';

export const command: ISlashCommand = {
	data: new SlashCommandBuilder()
		.setName('get-level')
		.setDescription('Check your current level and XP status'),

	async execute(interaction: CommandInteraction): Promise<any> {
		const { id: discordId } = interaction.user;
		const client = interaction.client as IDiscordClient;

		try {
			const [user] = await client.db.queryRaw(
				'SELECT * FROM Users WHERE id = ?',
				[discordId],
			);

			if (!user) {
				return await interaction.reply({
					content:
						"It looks like you haven't gained any XP yet. Start chatting to earn some!",
					ephemeral: true,
				});
			}

			const { xp, level } = user;
			const xpNextLevel = xpToNextLevel(level + 1);
			const xpNeeded = xpNextLevel - xp;
			const messagesNeeded = calculate(xp);

			return await interaction.reply({
				content: `You are currently at **Level ${level}** with **${xp} XP**. To reach the next level, you need **${xpNeeded} more XP**. That’s approximately **${messagesNeeded} more messages** to go! Keep chatting and leveling up!`,
				ephemeral: true,
			});
		} catch (error) {
			console.error('Error retrieving user data:', error);
			return await interaction.reply({
				content:
					'Oops! Something went wrong while fetching your level information. Please try again later.',
				ephemeral: true,
			});
		}
	},
};
