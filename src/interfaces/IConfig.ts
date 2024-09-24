export default interface IConfig {
	createVoice: {
		/**
		 * The channel ID where the voice channels will be created from
		 */
		channelId: string;
		/**
		 * The category ID where the voice channels will be created
		 */
		categoryId: string;
		/**
		 * The channel IDs that should not be deleted
		 */
		noDelete: string[];
	};
	/**
	 * The staff role that will be used for moderation commands
	 */
	staffRole: string;
	/**
	 * The prefix that will be used for commands
	 */
	prefix: string;

	welcomer: {
		/**
		 * The channel ID where the welcome message will be sent
		 */
		channelId: string;

		/**
		 * The rules channel ID
		 */
		rulesChannel: string;
	};
	/**
	 * The ID of the channel where economy messages will be sent
	 */
	economyChannelId: string;
	/**
	 * The roles that will be assigned based on the user's level
	 */
	levelRoles: {
		[level: number]: string;
	};

	/**
	 * Web server config
	 */
	webServer: {
		/**
		 * The port that the web server will run on
		 */
		port: number;
		/**
		 * The host that the web server will run on
		 */
		host: '0.0.0.0' | '127.0.0.1' | 'localhost';
	};
}
