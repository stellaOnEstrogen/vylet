import { Events, ActivityType } from 'discord.js';
import ManageEconomy from '~/classes/ManageEconomy';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { startPetSystem } from '~/utils/pets';

function getActivityType(type: string): ActivityType | undefined {
	switch (type.toLowerCase()) {
		case 'playing':
			return ActivityType.Playing;
		case 'listening':
			return ActivityType.Listening;
		case 'watching':
			return ActivityType.Watching;
		case 'competing':
			return ActivityType.Competing;
		case 'custom':
			return ActivityType.Custom;
		default:
			return undefined;
	}
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client: IDiscordClient) {
		const activities = client.config.Activities;
		const randomStartupActivity =
			activities[Math.floor(Math.random() * activities.length)];

		console.log(`Logged into Discord as ${client.user?.tag}`);
		console.log(`Setting startup activity: ${randomStartupActivity.name}`);

		client.user?.setActivity(randomStartupActivity.name, {
			type: getActivityType(randomStartupActivity.type || 'PLAYING'),
		});

		setInterval(() => {
			const random = activities[Math.floor(Math.random() * activities.length)];

			if (!random || typeof random.type !== 'string') {
				return;
			}

			const activityType: ActivityType | undefined = getActivityType(
				random.type,
			);

			if (activityType !== undefined) {
				const activityName: string = random.name || '';

				client.user?.setActivity({ type: activityType, name: activityName });
			}
		}, 5000);

		await startPetSystem(client.db);

		
	},
};
