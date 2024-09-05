import { Client, Collection } from 'discord.js';
import ISlashCommand from './ISlashCommand';
import IMessageCommand from './IMessageCommand';
import IDiscordBotConfig from './IDiscordBotConfig';
import { IAppDB } from '~/classes/AppDB';

interface IDiscordClient extends Client<boolean> {
	slashCommands: Collection<string, ISlashCommand>;
	messageCommands: Collection<string, IMessageCommand>;
	cooldowns: Collection<string, Collection<string, number>>;
	config: IDiscordBotConfig;
	db: IAppDB;
}

export default IDiscordClient;
