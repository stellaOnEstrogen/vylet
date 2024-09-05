import cron from 'node-cron';
import { EventEmitter } from 'events';
import IDiscordClient from '~/interfaces/IDiscordClient';

const BASE_TAX_RATE = 0.1; // 10% base tax rate
const INFLATION_RATE = 2.0; // 2% inflation per cycle
// 5 minutes for testing
const ECONOMY_INTERVAL = '*/1 * * * *'; // Every 5 minutes
const RANDOM_EVENT_INTERVAL = '0 12 * * *'; // Every day at noon
const GOVERNMENT_GRANT_AMOUNT = 1000; // Amount of grant for each user
const BOOM_FACTOR = 1.2; // 20% boost during economic boom
const RECESSION_FACTOR = 0.8; // 20% reduction during a recession

interface EconomyEvent {
	taxAdded: (userId: string, tax: number, total: number) => void;
	inflationApplied: (rate: number) => void;
	marketPricesAdjusted: (itemId: string, newPrice: number) => void;
	governmentGrantIssued: (amount: number) => void;
	economicBoom: () => void;
	economicRecession: () => void;
}

export default class ManageEconomy extends EventEmitter {
	on<K extends keyof EconomyEvent>(event: K, listener: EconomyEvent[K]): this {
		return super.on(event, listener);
	}

	off<K extends keyof EconomyEvent>(event: K, listener: EconomyEvent[K]): this {
		return super.off(event, listener);
	}

	once<K extends keyof EconomyEvent>(
		event: K,
		listener: EconomyEvent[K],
	): this {
		return super.once(event, listener);
	}

	emit<K extends keyof EconomyEvent>(
		event: K,
		...args: Parameters<EconomyEvent[K]>
	): boolean {
		return super.emit(event, ...args);
	}

	constructor(private client: IDiscordClient) {
		super();
		console.log('Economy manager started.');
		this.autoManageEconomy();
		this.scheduleRandomEconomicEvents();
	}

	private autoManageEconomy() {
		cron.schedule(ECONOMY_INTERVAL, async () => {
			await this.applyTaxes();
			await this.applyInflation(INFLATION_RATE);
			await this.adjustMarketPrices();
		});
	}

	private scheduleRandomEconomicEvents() {
		cron.schedule(RANDOM_EVENT_INTERVAL, async () => {
			const randomEvent = Math.random();
			if (randomEvent < 0.1) {
				await this.economicBoom();
			} else if (randomEvent < 0.2) {
				await this.economicRecession();
			} else if (randomEvent < 0.3) {
				await this.issueGovernmentGrants();
			}
		});
	}

	private async applyTaxes() {
		const users = await this.client.db.queryRaw(
			'SELECT id, balance FROM Users',
		);
		for (const user of users) {
			let taxRate = BASE_TAX_RATE;
			if (user.balance > 10000) {
				taxRate += 0.05;
			}
			const taxAmount = parseFloat(user.balance) * taxRate;
			const newBalance = parseFloat(user.balance) - taxAmount;
			await this.client.db.queryRaw(
				'UPDATE Users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
				[newBalance, user.id],
			);
			console.log(`User ${user.id} has been taxed ${taxAmount}`);
			await this.recordTransaction(user.id, 'tax', -taxAmount, 'Tax deduction');
			this.emit('taxAdded', user.id, taxAmount, newBalance);
		}
		console.log(`Applied taxes with progressive rates.`);
	}

	private async applyInflation(rate: number) {
		const users = await this.client.db.queryRaw(
			'SELECT id, balance FROM Users',
		);
		for (const user of users) {
			const newBalance = parseFloat(user.balance) * (1 + rate / 100);
			await this.client.db.queryRaw(
				'UPDATE Users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
				[newBalance, user.id],
			);
		}
		await this.client.db.queryRaw(
			'INSERT INTO Inflation (rate, applied_at) VALUES (?, CURRENT_TIMESTAMP)',
			[rate],
		);
		this.emit('inflationApplied', rate);
		console.log(`Applied inflation at a rate of ${rate}%`);
	}

	private async adjustMarketPrices() {
		const items = await this.client.db.queryRaw(
			'SELECT id, base_price, demand, supply FROM Market',
		);
		for (const item of items) {
			const priceFactor = item.demand > item.supply ? 1.1 : 0.9;
			const newPrice = parseFloat(item.base_price) * priceFactor;
			await this.client.db.queryRaw(
				'UPDATE Market SET current_price = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
				[newPrice, item.id],
			);
			this.emit('marketPricesAdjusted', item.id, newPrice);
		}
		console.log('Adjusted market prices based on demand and supply.');
	}

	private async recordTransaction(
		userId: string,
		type: string,
		amount: number,
		description: string,
	) {
		await this.client.db.queryRaw(
			'INSERT INTO Transactions (user_id, type, amount, description, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
			[userId, type, amount, description],
		);
	}

	private async issueGovernmentGrants() {
		const users = await this.client.db.queryRaw('SELECT id FROM Users');
		for (const user of users) {
			await this.client.db.queryRaw(
				'UPDATE Users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
				[GOVERNMENT_GRANT_AMOUNT, user.id],
			);

			await this.recordTransaction(
				user.id,
				'grant',
				GOVERNMENT_GRANT_AMOUNT,
				'Government grant issued',
			);
		}
		this.emit('governmentGrantIssued', GOVERNMENT_GRANT_AMOUNT);
		console.log(
			`Government grant of ${GOVERNMENT_GRANT_AMOUNT} issued to all users.`,
		);
	}

	private async economicBoom() {
		const items = await this.client.db.queryRaw(
			'SELECT id, base_price FROM Market',
		);
		for (const item of items) {
			const newPrice = parseFloat(item.base_price) * BOOM_FACTOR;
			await this.client.db.queryRaw(
				'UPDATE Market SET current_price = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
				[newPrice, item.id],
			);
		}
		this.emit('economicBoom');
		console.log('Economic boom! Market prices increased.');
	}

	private async economicRecession() {
		const items = await this.client.db.queryRaw(
			'SELECT id, base_price FROM Market',
		);
		for (const item of items) {
			const newPrice = parseFloat(item.base_price) * RECESSION_FACTOR;
			await this.client.db.queryRaw(
				'UPDATE Market SET current_price = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
				[newPrice, item.id],
			);
		}
		this.emit('economicRecession');
		console.log('Economic recession! Market prices decreased.');
	}
}
