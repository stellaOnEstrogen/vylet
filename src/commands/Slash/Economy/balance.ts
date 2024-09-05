import {
	SlashCommandBuilder,
	CommandInteraction,
	EmbedBuilder,
} from 'discord.js';
import ISlashCommand from '~/interfaces/ISlashCommand';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { getUserBalance } from '~/utils/economy';

export const command: ISlashCommand = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Check your balance'),
	async execute(interaction: CommandInteraction): Promise<any> {
		const balance = await getUserBalance(
			interaction.user.id,
			interaction.client as IDiscordClient,
		);

		const embed = new EmbedBuilder()
			.setTitle('💰 Balance')
			.setDescription(
				`Your current balance is ${balance.toFixed(2)}. Use \`/mine\` to earn more!`,
			);
		return interaction.reply({ embeds: [embed] });
	},
};
