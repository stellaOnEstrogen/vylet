import IDiscordClient from '~/interfaces/IDiscordClient';
import { Events, Interaction } from 'discord.js';

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction: Interaction, client: IDiscordClient) {
		if (interaction.user.bot) return;
		if (interaction.isChatInputCommand() || interaction.isCommand()) {
			const command = client.slashCommands.get(interaction.commandName);

			if (!command) {
				console.error(
					`Command ${interaction.commandName} not found in client.slashCommands`,
				);
				return;
			}

			if (!interaction.guild) {
				console.error(
					`Command ${interaction.commandName} was used outside of a guild`,
				);
				return;
			}

			try {
				if (!command.execute) {
					console.error(
						`Command ${interaction.commandName} does not have an execute method`,
					);
					return;
				}
				await command.execute(interaction);
				console.log(
					`${interaction.user.tag} used command ${interaction.commandName} in guild ${interaction.guild?.name} (${interaction.guild?.id}) in the channel ${interaction.guild?.channels.cache.get(interaction.channel?.id as string)?.name} (${interaction.channel?.id})`,
				);
			} catch (error) {
				console.error(
					`Error while executing command ${interaction.commandName}: ${error}`,
				);
				await interaction.reply({
					content: 'There was an error while executing this command!',
					ephemeral: true,
				});
			}
		} else if (interaction.isAutocomplete()) {
			const command = client.slashCommands.get(interaction.commandName);

			if (!command) return;

			if (!interaction.guild) return;

			try {
				if (!command.autocomplete) return;
				await command.autocomplete(interaction);
				console.log(
					`${interaction.user.tag} autocompleted command ${interaction.commandName} in guild ${interaction.guild?.name} (${interaction.guild?.id}) in the channel ${interaction.guild?.channels.cache.get(interaction.channel?.id as string)?.name} (${interaction.channel?.id})`,
				);
			} catch (error) {
				console.error(
					`Error while executing command ${interaction.commandName}: ${error}`,
				);
			}
		}
	},
};
