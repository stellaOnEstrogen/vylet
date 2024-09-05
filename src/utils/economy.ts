import IDiscordClient from '~/interfaces/IDiscordClient';

async function getUserBalance(
	userId: string,
	client: IDiscordClient,
): Promise<number> {
	const user = await client.db.queryRaw(
		'SELECT balance FROM Users WHERE id = ?',
		[userId],
	);
	if (!user.length) {
		await client.db.queryRaw('INSERT INTO Users (id, balance) VALUES (?, ?)', [
			userId,
			0.0,
		]);
		return 0.0;
	}
	return parseFloat(user[0].balance);
}

async function updateUserBalance(
	userId: string,
	amount: number,
	client: IDiscordClient,
) {
	await client.db.queryRaw(
		'UPDATE Users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
		[amount, userId],
	);
}

async function recordTransaction(
	userId: string,
	type: string,
	amount: number,
	description: string,
	client: IDiscordClient,
) {
	await client.db.queryRaw(
		'INSERT INTO Transactions (user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
		[userId, type, amount, description],
	);
}

async function getTransactions(
	userId: string,
	client: IDiscordClient,
	limit: number,
) {
	const transactions = await client.db.queryRaw(
		'SELECT * FROM Transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
		[userId, limit],
	);
	return transactions;
}

// LMAO FURRY INFLATION MENTIONED
async function applyInflation(rate: number, client: IDiscordClient) {
	const users = await client.db.queryRaw('SELECT id, balance FROM Users');
	for (const user of users) {
		const newBalance = parseFloat(user.balance) * (1 + rate / 100);
		await client.db.queryRaw(
			'UPDATE Users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
			[newBalance, user.id],
		);
	}
	await client.db.queryRaw(
		'INSERT INTO Inflation (rate, applied_at) VALUES (?, CURRENT_TIMESTAMP)',
		[rate],
	);
	console.log(`Applied inflation at a rate of ${rate}%`);
}

async function adjustMarketPrices(client: IDiscordClient) {
	const items = await client.db.queryRaw(
		'SELECT id, base_price, demand, supply FROM Market',
	);
	for (const item of items) {
		const priceFactor = item.demand > item.supply ? 1.1 : 0.9;
		const newPrice = parseFloat(item.base_price) * priceFactor;
		await client.db.queryRaw(
			'UPDATE Market SET current_price = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
			[newPrice, item.id],
		);
	}
	console.log('Adjusted market prices based on demand and supply.');
}

export {
	getUserBalance,
	updateUserBalance,
	recordTransaction,
	applyInflation,
	adjustMarketPrices,
	getTransactions,
};
