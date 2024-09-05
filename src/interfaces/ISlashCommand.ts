import { CommandInteraction, AutocompleteInteraction } from 'discord.js';

interface ISlashCommand {
	//! WARN: Data is set to any because I would have to include EVERY option in the builder
	data: any;
	execute: (interaction: CommandInteraction) => Promise<any>;
	autocomplete?: (interaction: AutocompleteInteraction) => Promise<any>;
}

export default ISlashCommand;
