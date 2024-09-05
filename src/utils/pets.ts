import cron from 'node-cron';

export const DECAY_RATE = {
	hunger: 5, // lose 5 points every hour
	happiness: 3,
	energy: 4,
};

export const MAX_STATS = 100;
export const MIN_STATS = 0;

export const startPetSystem = async (db: any) => {
	cron.schedule('0 * * * *', async () => {
		const currentTime = new Date();
		const pets = await db.query`SELECT * FROM UserPets`;

		for (const pet of pets) {
			const petData = pet[0];

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

			await db.query`UPDATE UserPets SET hunger = ${petData.hunger}, happiness = ${petData.happiness}, energy = ${petData.energy}, updated_at = ${currentTime} WHERE user_id = ${petData.user_id}`;
		}
	});
};
