import {
	SlashCommandBuilder,
	CommandInteraction,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType,
} from 'discord.js';
import ISlashCommand from '~/interfaces/ISlashCommand';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { recordTransaction, updateUserBalance } from '~/utils/economy';

// Cooldown for 5 minutes
const cooldowns = new Map();

export const command: ISlashCommand = {
	data: new SlashCommandBuilder()
		.setName('mine')
		.setDescription('Mine for resources'),
	async execute(interaction: CommandInteraction): Promise<any> {
		const EMOJIS = {
			empty: '⬛',
			rock: '⛏️',
			gold: '💰',
			iron: '🔨',
			emerald: '💎',
		};

		if (cooldowns.has(interaction.user.id)) {
			const cooldown = cooldowns.get(interaction.user.id);
			const remainingTime = (cooldown + 300000 - Date.now()) / 1000;
			if (remainingTime <= 0) {
				cooldowns.delete(interaction.user.id);
			} else {
				const unixTimestampTill = Math.floor(
					(Date.now() + remainingTime * 1000) / 1000,
				);
				return interaction.reply({
					content: `You're too tired to mine right now. Try again <t:${unixTimestampTill}:R>.`,
					ephemeral: true,
				});
			}
		}

		const MINE_SIZE = 19;
		const mineField: string[] = Array(MINE_SIZE).fill(EMOJIS.empty);

		// Randomly place rocks and gold
		const randomIndex = () => Math.floor(Math.random() * MINE_SIZE);
		mineField[randomIndex()] = EMOJIS.rock;
		mineField[randomIndex()] = EMOJIS.gold;
		mineField[randomIndex()] = EMOJIS.iron;
		mineField[randomIndex()] = EMOJIS.emerald;

		// Create buttons for the minefield
		const buttons = mineField.map((cell, index) =>
			new ButtonBuilder()
				.setCustomId(`mine_${index}`)
				.setLabel(EMOJIS.empty)
				.setStyle(ButtonStyle.Secondary),
		);

		// Split buttons into rows
		const rows: ActionRowBuilder<ButtonBuilder>[] = [];
		for (let i = 0; i < buttons.length; i += 5) {
			rows.push(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					buttons.slice(i, i + 5),
				),
			);
		}

		const embed = new EmbedBuilder()
			.setTitle('⛏️ Mining Adventure')
			.setColor('Green')
			.setDescription("Click a tile to reveal what's underneath!");

		const message = await interaction.reply({
			embeds: [embed],
			components: rows,
			fetchReply: true,
		});

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60000, // 1 minute to interact
		});

		collector.on('collect', async (buttonInteraction) => {
			if (buttonInteraction.user.id !== interaction.user.id) {
				return buttonInteraction.reply({
					content: 'This mine is not yours to explore!',
					ephemeral: true,
				});
			}

			const index = parseInt(buttonInteraction.customId.split('_')[1], 10);
			const revealedCell = mineField[index];

			// Update the button with the revealed content
			buttons[index]
				.setLabel(revealedCell)
				.setStyle(
					revealedCell === EMOJIS.gold ?
						ButtonStyle.Success
					:	ButtonStyle.Danger,
				)
				.setDisabled(true);

			// Edit the message with the updated buttons
			await buttonInteraction.update({
				components: rows,
			});

			switch (revealedCell) {
				case EMOJIS.gold:
					await updateUserBalance(
						interaction.user.id,
						50,
						buttonInteraction.client as IDiscordClient,
					);
					await recordTransaction(
						interaction.user.id,
						'earn',
						50,
						'Mined gold',
						buttonInteraction.client as IDiscordClient,
					);
					await interaction.followUp({
						content: 'You struck gold and earned $50!',
						ephemeral: true,
					});
					collector.stop('gold_found');
					break;
				case EMOJIS.rock:
					await interaction.followUp({
						content: 'You hit a rock. Better luck next time!',
						ephemeral: true,
					});
					collector.stop('rock_hit');
					break;
				case EMOJIS.iron:
					await updateUserBalance(
						interaction.user.id,
						20,
						buttonInteraction.client as IDiscordClient,
					);
					await recordTransaction(
						interaction.user.id,
						'earn',
						20,
						'Mined iron',
						buttonInteraction.client as IDiscordClient,
					);
					await interaction.followUp({
						content: 'You found iron and earned $20!',
						ephemeral: true,
					});
					break;
				case EMOJIS.emerald:
					await updateUserBalance(
						interaction.user.id,
						100,
						buttonInteraction.client as IDiscordClient,
					);
					await recordTransaction(
						interaction.user.id,
						'earn',
						100,
						'Mined emerald',
						buttonInteraction.client as IDiscordClient,
					);
					await interaction.followUp({
						content: 'You found emerald and earned $100!',
						ephemeral: true,
					});
					break;
				default:
					await interaction.followUp({
						content: 'You found nothing.',
						ephemeral: true,
					});
					break;
			}
		});

		collector.on('end', () => {
			const disabledButtons = buttons.map((btn) => btn.setDisabled(true));
			const disabledRows = [];
			for (let i = 0; i < disabledButtons.length; i += 5) {
				disabledRows.push(
					new ActionRowBuilder<ButtonBuilder>().addComponents(
						disabledButtons.slice(i, i + 5),
					),
				);
			}
			embed.setDescription('Mining adventure has ended.');
			embed.setColor('Red');
			cooldowns.set(interaction.user.id, Date.now());
			interaction.editReply({ components: disabledRows, embeds: [embed] });
		});
	},
};
