import {
	SlashCommandBuilder,
	CommandInteraction,
	AutocompleteInteraction,
	EmbedBuilder,
} from 'discord.js';
import ISlashCommand from '~/interfaces/ISlashCommand';
import IDiscordClient from '~/interfaces/IDiscordClient';

export const command: ISlashCommand = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Get help with the bot')
		.addStringOption((option) =>
			option
				.setName('query')
				.setDescription('Phrase to search for')
				.setRequired(true)
				.setAutocomplete(true),
		),
	async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
		const commands = (interaction.client as IDiscordClient).slashCommands;

		const focusedValue = interaction.options.getFocused();
		const choices = commands.map((command) => command.data.name);
		const filtered = choices.filter((choice: any) =>
			choice.startsWith(focusedValue),
		);
		await interaction.respond(
			filtered.map((choice: any) => ({
				name: choice,
				value: choice.toLowerCase(),
			})),
		);
	},
	async execute(interaction: CommandInteraction): Promise<any> {
		//@ts-ignore - Placing this here until I can figure out how to properly type this
		const query = interaction.options.getString('query');

		if (!query) {
			return interaction.reply({
				content: 'Please provide a search query',
				ephemeral: true,
			});
		}

		const commands = (interaction.client as IDiscordClient).slashCommands;

		const command = commands.get(query);

		if (!command) {
			return interaction.reply({
				content: 'Command not found',
				ephemeral: true,
			});
		}

		let fields: any[] = [];

		if (command.data.options) {
			fields = command.data.options.map((option: any) => {
				const j = option.toJSON();
				return {
					name: j.name,
					value: j.description,
					required: j.required,
				};
			});
		}

		const embed = new EmbedBuilder()
			.setTitle(`**${command.data.name}**`)
			.setDescription(command.data.description)
			.setFooter({
				text: `Requested by ${interaction.user.username}`,
				iconURL: interaction.user.avatarURL() || '',
			});

		if (fields.length) {
			embed.addFields({
				name: 'Options',
				value: fields
					.map((field: any) => {
						return `**${field.name}** - ${field.value} (${field.required ? 'Required' : 'Optional'})`;
					})
					.join('\n'),
			});
		}

		return interaction.reply({
			embeds: [embed],
		});
	},
};
