import {
	SlashCommandBuilder,
	CommandInteraction,
	EmbedBuilder,
} from 'discord.js';
import ISlashCommand from '~/interfaces/ISlashCommand';
import { AppDB } from '~/classes/AppDB';
import { uuid } from '~/utils/uuid';

const FishTypes = [
	{ name: 'Common Fish', weightRange: [1, 5], rarity: 'common' },
	{ name: 'Salmon', weightRange: [2, 7], rarity: 'common' },
	{ name: 'Tuna', weightRange: [5, 12], rarity: 'uncommon' },
	{ name: 'Golden Carp', weightRange: [8, 15], rarity: 'rare' },
	{ name: 'Shark', weightRange: [20, 50], rarity: 'epic' },
	{ name: 'Mysterious Kraken', weightRange: [50, 100], rarity: 'legendary' },
];

const Treasures = [
	{ name: 'Ancient Coin', rarity: 'rare' },
	{ name: 'Old Boot', rarity: 'common' },
	{ name: 'Golden Crown', rarity: 'epic' },
];

const Locations = {
	lake: {
		name: 'Lake',
		rarities: { common: 60, uncommon: 30, rare: 8, epic: 2, legendary: 0 },
	},
	river: {
		name: 'River',
		rarities: { common: 50, uncommon: 40, rare: 7, epic: 2.5, legendary: 0.5 },
	},
	ocean: {
		name: 'Ocean',
		rarities: { common: 40, uncommon: 30, rare: 15, epic: 10, legendary: 5 },
	},
};

function priceToSell(rarity: string, isTreasure: boolean, weight?: number) {
	if (isTreasure) {
		switch (rarity) {
			case 'common':
				return 100; // Old Boot
			case 'rare':
				return 1000; // Ancient Coin
			case 'epic':
				return 10000; // Golden Crown
			case 'legendary':
				return 50000; // Special rare treasure if added later
		}
	} else {
		switch (rarity) {
			case 'common':
				return weight! * 15; // Price increased for common fish
			case 'uncommon':
				return weight! * 30; // Price for uncommon fish
			case 'rare':
				return weight! * 75; // Rare fish are worth more
			case 'epic':
				return weight! * 200; // Epic fish have a higher multiplier
			case 'legendary':
				return weight! * 5000; // Legendary fish are incredibly valuable
		}
	}

	return 0;
}

function getRandomFish(location: string) {
	const rarities = Locations[location as keyof typeof Locations].rarities;
	const rarityPool: { name: string; weightRange: number[]; rarity: string }[] =
		[];

	for (const fish of FishTypes) {
		for (let i = 0; i < rarities[fish.rarity as keyof typeof rarities]; i++) {
			rarityPool.push(fish);
		}
	}

	const randomFish = rarityPool[Math.floor(Math.random() * rarityPool.length)];
	const weight =
		Math.random() * (randomFish.weightRange[1] - randomFish.weightRange[0]) +
		randomFish.weightRange[0];

	return { ...randomFish, weight: weight.toFixed(2) };
}

function getRandomTreasure() {
	return Treasures[Math.floor(Math.random() * Treasures.length)];
}

export const command: ISlashCommand = {
	data: new SlashCommandBuilder()
		.setName('fish')
		.setDescription('Go fishing and try to catch some fish!')
		.addStringOption((option) =>
			option
				.setName('location')
				.setDescription('Where do you want to fish?')
				.setRequired(true)
				.addChoices(
					{ name: 'Lake', value: 'lake' },
					{ name: 'River', value: 'river' },
					{ name: 'Ocean', value: 'ocean' },
				),
		),
	async execute(interaction: CommandInteraction): Promise<any> {
		//@ts-ignore
		const location = interaction.options.getString('location') as string;
		const db = AppDB.getInstance();
		const user = interaction.user;

		// 2% chance to catch a treasure
		const isTreasure = Math.random() < 0.02;

		let result: any;
		if (isTreasure) {
			result = getRandomTreasure();
		} else {
			result = getRandomFish(location);
		}

		const embed = new EmbedBuilder()
			.setTitle(
				`🎣 ${user.username} went fishing in the ${Locations[location as keyof typeof Locations].name}!`,
			)
			.setDescription(
				isTreasure ?
					`You found a treasure! **${result.name}** (${result.rarity})`
				:	`You caught a **${result.name}** weighing ${result.weight} kg! (${result.rarity})`,
			)
			.setColor(isTreasure ? 'Gold' : 'Blue')
			.setFooter({
				text: 'Keep fishing to catch more rare fish or treasures!',
			});

		// Store catch in database
		const fishId = uuid({ version: 4 });
		const price = priceToSell(
			result.rarity,
			isTreasure,
			parseFloat(result.weight || '0'),
		);
		if (isTreasure) {
			await db.query`INSERT INTO UserCatches (user_id, catch_id, type, name, rarity, price) VALUES (${user.id}, ${fishId}, 'treasure', ${result.name}, ${result.rarity}, ${price})`;
		} else {
			await db.query`INSERT INTO UserCatches (user_id, catch_id, type, name, weight, rarity, price) VALUES (${user.id}, ${fishId}, 'fish', ${result.name}, ${result.weight}, ${result.rarity}, ${price})`;
		}

		return interaction.reply({ embeds: [embed] });
	},
};
