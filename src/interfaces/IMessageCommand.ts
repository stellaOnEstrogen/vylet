import { Message } from 'discord.js';
import IDiscordClient from './IDiscordClient';

interface IMessageCommand {
	name: string;
	description: string;
	usage?: string;
	staffOnly?: boolean;
	execute: (
		message: Message<boolean>,
		client: IDiscordClient,
		args: string[],
	) => Promise<void | Message<boolean> | undefined>;
}
export default IMessageCommand;
