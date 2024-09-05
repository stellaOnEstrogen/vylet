import {
	SlashCommandBuilder,
	CommandInteraction,
	EmbedBuilder,
	TextChannel,
} from 'discord.js';
import ISlashCommand from '~/interfaces/ISlashCommand';
import IDiscordClient from '~/interfaces/IDiscordClient';
import { AppDB } from '~/classes/AppDB';
import { uuid } from '~/utils/uuid';
import { MIN_STATS, MAX_STATS, DECAY_RATE } from '~/utils/pets';

const PetTypes = ['cat', 'dog', 'bird', 'fish', 'hamster', 'rabbit', 'turtle'];
const PetEmojis = {
	cat: '🐱',
	dog: '🐶',
	bird: '🐦',
	fish: '🐠',
	hamster: '🐹',
	rabbit: '🐰',
	turtle: '🐢',
};

export const command: ISlashCommand = {
	data: new SlashCommandBuilder()
		.setName('pet')
		.setDescription('Manage your pet')
		.addStringOption((option) =>
			option
				.setName('action')
				.setDescription('The action to perform')
				.setRequired(true)
				.addChoices(
					{ name: 'Feed', value: 'feed' },
					{ name: 'Pet', value: 'pet' },
					{ name: 'Play', value: 'play' },
					{ name: 'Scold', value: 'scold' },
					{ name: 'Sleep', value: 'sleep' },
					{ name: 'Train', value: 'train' },
					{ name: 'View', value: 'view' },
					{ name: 'Create', value: 'create' },
				),
		),
	async execute(interaction: CommandInteraction): Promise<any> {
		//@ts-ignore
		const action = interaction.options.getString('action') as string;
		const user = interaction.user;
		const db = AppDB.getInstance();

		const pet =
			await db.query`SELECT * FROM UserPets WHERE user_id = ${user.id}`;

		if (!pet.length && action !== 'create') {
			return interaction.reply(
				'You do not have a pet. Use `/pet create` to create one.',
			);
		}

		const petData = pet[0];
		const currentTime = new Date();

		// Apply stat decay
		const hoursSinceUpdate =
			(currentTime.getTime() - new Date(petData.updated_at).getTime()) /
			(1000 * 60 * 60);

		petData.hunger = Math.max(
			MIN_STATS,
			petData.hunger - Math.floor(hoursSinceUpdate * DECAY_RATE.hunger),
		);
		petData.happiness = Math.max(
			MIN_STATS,
			petData.happiness - Math.floor(hoursSinceUpdate * DECAY_RATE.happiness),
		);
		petData.energy = Math.max(
			MIN_STATS,
			petData.energy - Math.floor(hoursSinceUpdate * DECAY_RATE.energy),
		);

		// Update stats in database after decay
		await db.query`UPDATE UserPets SET hunger = ${petData.hunger}, happiness = ${petData.happiness}, energy = ${petData.energy}, updated_at = ${currentTime} WHERE user_id = ${user.id}`;

		switch (action) {
			case 'feed':
				petData.hunger = Math.min(MAX_STATS, petData.hunger + 20);
				await db.query`UPDATE UserPets SET hunger = ${petData.hunger}, updated_at = ${currentTime} WHERE user_id = ${user.id}`;
				return interaction.reply(
					`You fed your pet! Hunger is now ${petData.hunger}.`,
				);

			case 'pet':
				petData.happiness = Math.min(MAX_STATS, petData.happiness + 15);
				await db.query`UPDATE UserPets SET happiness = ${petData.happiness}, updated_at = ${currentTime} WHERE user_id = ${user.id}`;
				return interaction.reply(
					`You petted your pet! Happiness is now ${petData.happiness}.`,
				);

			case 'play':
				if (petData.energy < 20) {
					return interaction.reply(
						'Your pet is too tired to play. Make them sleep first.',
					);
				}
				petData.happiness = Math.min(MAX_STATS, petData.happiness + 20);
				petData.energy = Math.max(MIN_STATS, petData.energy - 20);
				await db.query`UPDATE UserPets SET happiness = ${petData.happiness}, energy = ${petData.energy}, updated_at = ${currentTime} WHERE user_id = ${user.id}`;
				return interaction.reply(
					`You played with your pet! Happiness is now ${petData.happiness}, and energy is ${petData.energy}.`,
				);

			case 'scold':
				petData.happiness = Math.max(MIN_STATS, petData.happiness - 10);
				await db.query`UPDATE UserPets SET happiness = ${petData.happiness}, updated_at = ${currentTime} WHERE user_id = ${user.id}`;
				return interaction.reply(
					`You scolded your pet! Happiness decreased to ${petData.happiness}.`,
				);

			case 'sleep':
				petData.energy = Math.min(MAX_STATS, petData.energy + 30);
				await db.query`UPDATE UserPets SET energy = ${petData.energy}, updated_at = ${currentTime} WHERE user_id = ${user.id}`;
				return interaction.reply(
					`Your pet took a nap! Energy is now ${petData.energy}.`,
				);

			case 'train':
				if (petData.energy < 30) {
					return interaction.reply(
						'Your pet is too tired to train. Make them sleep first.',
					);
				}
				petData.happiness = Math.min(MAX_STATS, petData.happiness + 10);
				petData.energy = Math.max(MIN_STATS, petData.energy - 30);
				await db.query`UPDATE UserPets SET happiness = ${petData.happiness}, energy = ${petData.energy}, updated_at = ${currentTime} WHERE user_id = ${user.id}`;
				return interaction.reply(
					`You trained your pet! Happiness is now ${petData.happiness}, and energy is ${petData.energy}.`,
				);

			case 'view':
				const petType = petData.pet_type;
				const embed = new EmbedBuilder()
					.setTitle(`${PetEmojis[petType as keyof typeof PetEmojis]} Your Pet`)
					.setDescription(
						`**Hunger:** ${petData.hunger}\n**Happiness:** ${petData.happiness}\n**Energy:** ${petData.energy}\n**Health:** ${petData.health}`,
					)
					.setColor('Blue')
					.setFooter({ text: `Use /pet <action> to interact with your pet` });

				return interaction.reply({ embeds: [embed] });

			case 'create':
				let petTypeInput: string;

				interaction.reply(
					`What kind of pet would you like to create? (${PetTypes.join(', ')})`,
				);
				const filter = (m: any) => m.author.id === interaction.user.id;

				(interaction.channel as TextChannel)
					?.awaitMessages({
						filter,
						time: 60_000,
						max: 1,
						errors: ['time'],
					})
					.then(async (messages) => {
						const name = messages.first()?.content;
						if (!name)
							return interaction.followUp('You did not enter any input!');
						if (!PetTypes.includes(name.toLowerCase())) {
							return interaction.followUp(
								`Invalid pet type. Please choose from: ${PetTypes.join(', ')}`,
							);
						}

						petTypeInput = name;
						await db.query`INSERT INTO UserPets (user_id, pet_id, pet_type, id) VALUES (${user.id}, ${uuid({ version: 4 })}, ${petTypeInput}, ${uuid({ version: 4 })})`;

						return interaction.followUp(
							`You have created a ${petTypeInput} pet!`,
						);
					})
					.catch(() => interaction.followUp('You did not enter any input!'));
				break;
		}
	},
};
