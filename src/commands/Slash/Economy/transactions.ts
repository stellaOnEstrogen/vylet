import {
	SlashCommandBuilder,
	CommandInteraction,
	EmbedBuilder,
} from 'discord.js';
import ISlashCommand from '~/interfaces/ISlashCommand';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { getUserBalance, getTransactions } from '~/utils/economy';

const formatWord = (word: string) => {
	return word[0].toUpperCase() + word.slice(1).toLowerCase();
};

export const command: ISlashCommand = {
	data: new SlashCommandBuilder()
		.setName('transactions')
		.setDescription('Check your transactions'),
	async execute(interaction: CommandInteraction): Promise<any> {
		const client = interaction.client as IDiscordClient;
		const userId = interaction.user.id;

		const balance = await getUserBalance(userId, client);
		const transactions = await getTransactions(userId, client, 10);

		if (!transactions.length)
			return interaction.reply('You have no transactions');

		const embed = new EmbedBuilder()
			.setTitle('Transactions')
			.setDescription(
				`Your current balance is $${balance.toFixed(2)}. The last 10 transactions are:`,
			);

		embed.addFields(
			transactions.map((t, i) => ({
				name: `Transaction #${i + 1} (${formatWord(t.type)})`,
				value: `$${t.amount.toFixed(2)} - ${t.description}`,
			})),
		);

		return interaction.reply({ embeds: [embed] });
	},
};
