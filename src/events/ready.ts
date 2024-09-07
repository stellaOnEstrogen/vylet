import { Events, ActivityType, TextChannel } from 'discord.js';
import ManageEconomy from '~/classes/ManageEconomy';
import { config } from '~/config';
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

		const economy = new ManageEconomy(client);

		economy.on('taxAdded', async (userId, tax, total) => {
			const user = await client.users.fetch(userId);

			if (!user) {
				return;
			}

			try {
				await user.send(
					`You were taxed ${tax} dollars. Your new balance is $${total}.`,
				);
			} catch (e) {
				console.error(`Failed to send tax notification to ${user.tag}`);
			}
		});

		economy.on('inflationApplied', async (rate) => {
			const inflationMessage = `The economy has inflated by ${rate * 100}%!`;

			try {
				const channel = (await client.channels.fetch(
					config.economyChannelId,
				)) as TextChannel;

				channel.send(inflationMessage);
			} catch (e) {
				console.error(`Failed to send inflation message: ${e}`);
			}
		});

		economy.on('marketPricesAdjusted', async (itemId, newPrice) => {
			const item = await economy.getItem(itemId);

			if (!item) {
				return;
			}

			const message = `The price of ${item.name} has been adjusted to $${newPrice}.`;

			try {
				const channel = (await client.channels.fetch(
					config.economyChannelId,
				)) as TextChannel;

				channel.send(message);
			} catch (e) {
				console.error(`Failed to send market price adjustment message: ${e}`);
			}
		});

		economy.on('economicBoom', async (factor: number) => {
			const message = `The economy is booming! All citizens have received a ${factor * 100}% bonus!`;

			try {
				const channel = (await client.channels.fetch(
					config.economyChannelId,
				)) as TextChannel;

				channel.send(message);
			} catch (e) {
				console.error(`Failed to send economic boom message: ${e}`);
			}
		});

		economy.on('economicRecession', async () => {
			const message = 'The economy is in a recession!';

			try {
				const channel = (await client.channels.fetch(
					config.economyChannelId,
				)) as TextChannel;

				channel.send(message);
			} catch (e) {
				console.error(`Failed to send economic recession message: ${e}`);
			}
		});

		economy.on('governmentGrantIssued', async (amount) => {
			const message = `The government has issued a grant of $${amount} to all citizens!`;

			try {
				const channel = (await client.channels.fetch(
					config.economyChannelId,
				)) as TextChannel;

				channel.send(message);
			} catch (e) {
				console.error(`Failed to send government grant message: ${e}`);
			}
		});
	},
};
