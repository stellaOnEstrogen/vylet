interface IActivity {
	name: string;
	type?: 'PLAYING' | 'LISTENING' | 'WATCHING' | 'COMPETING' | 'CUSTOM';
}

export default interface IDiscordBotConfig {
	Activities: IActivity[];
	channels: {
		self_roles: string;
		events: string;
		polls: string;
		level_ups: string;
		giveaways: string;
	};
}
