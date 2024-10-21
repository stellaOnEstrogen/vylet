import cron from 'node-cron';
import { EventEmitter } from 'events';
import IDiscordClient from '~/interfaces/IDiscordClient';

const ECONOMY_INTERVAL = '0 0 * * *'; // Every day at midnight
// Every 5 days at noon
const RANDOM_EVENT_INTERVAL = '0 12 */5 * *';

interface EconomyEvent {
	taxAdded: (userId: string, tax: number, total: number) => void;
	inflationApplied: (rate: number) => void;
	marketPricesAdjusted: (itemId: string, newPrice: number) => void;
	governmentGrantIssued: (amount: number) => void;
	economicBoom: (factor: number) => void;
	economicRecession: () => void;
}

export default class ManageEconomy extends EventEmitter {
	constructor(private client: IDiscordClient) {
		super();
		console.log('Economy manager started.');
		this.autoManageEconomy();
		this.scheduleRandomEconomicEvents();
	}

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

	private autoManageEconomy() {
		cron.schedule(ECONOMY_INTERVAL, async () => {
			await this.applyTaxes();
			await this.applyInflation(this.getRandomInflationRate());
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

	private getRandomBaseTaxRate(): number {
		return Math.random() * 0.2; // Random base tax rate between 0% and 20%
	}

	private getRandomInflationRate(): number {
		return Math.random() * 5.0; // Random inflation rate between 0% and 5%
	}

	private async applyTaxes() {
		const users = await this.client.db.queryRaw(
			'SELECT CAST(id AS TEXT) as id, balance FROM Users',
			[],
			false,
		);

		for (const user of users) {
			let taxRate = this.getRandomBaseTaxRate();
			if (user.balance === 0) {
				return;
			} else if (user.balance > 10000) {
				taxRate += Math.random() * 0.1; // Extra random tax for balances over 10,000
			}
			const taxAmount = parseFloat(user.balance) * taxRate;
			const newBalance = parseFloat(user.balance) - taxAmount;

			await this.client.db.queryRaw(
				'UPDATE Users SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
				[newBalance, user.id],
			);

			await this.recordTransaction(user.id, 'tax', -taxAmount, 'Tax deduction');
			this.emit('taxAdded', user.id, taxAmount, newBalance);
		}

		console.log('Applied taxes with progressive rates.');
	}

	private async applyInflation(rate: number) {
		const users = await this.client.db.queryRaw(
			'SELECT CAST(id AS TEXT) as id, balance FROM Users',
			[],
			false,
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
			'SELECT CAST(id AS TEXT) as id, base_price, demand, supply FROM Market',
			[],
			false,
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

	private async issueGovernmentGrants() {
		const grantAmount = this.getRandomGovernmentGrantAmount();
		const users = await this.client.db.queryRaw('SELECT id FROM Users');

		for (const user of users) {
			await this.client.db.queryRaw(
				'UPDATE Users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
				[grantAmount, user.id],
			);

			await this.recordTransaction(
				user.id,
				'grant',
				grantAmount,
				'Government grant issued',
			);
		}

		this.emit('governmentGrantIssued', grantAmount);
		console.log(`Government grant of ${grantAmount} issued to all users.`);
	}

	private async economicBoom() {
		const boomFactor = this.getRandomBoomFactor();
		const items = await this.client.db.queryRaw(
			'SELECT id, base_price FROM Market',
		);

		for (const item of items) {
			const newPrice = parseFloat(item.base_price) * boomFactor;

			await this.client.db.queryRaw(
				'UPDATE Market SET current_price = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
				[newPrice, item.id],
			);
		}

		this.emit('economicBoom', boomFactor);
		console.log('Economic boom! Market prices increased.');
	}

	private async economicRecession() {
		const recessionFactor = this.getRandomRecessionFactor();
		const items = await this.client.db.queryRaw(
			'SELECT id, base_price FROM Market',
		);

		for (const item of items) {
			const newPrice = parseFloat(item.base_price) * recessionFactor;

			await this.client.db.queryRaw(
				'UPDATE Market SET current_price = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
				[newPrice, item.id],
			);
		}

		this.emit('economicRecession');
		console.log('Economic recession! Market prices decreased.');
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

	public async getItem(itemId: string) {
		const item = await this.client.db.queryRaw(
			'SELECT item_name FROM Market WHERE id = ?',
			[itemId],
		);

		return item[0];
	}

	private getRandomGovernmentGrantAmount(): number {
		return Math.random() * 500; // Random government grant between $0 and $500
	}

	private getRandomBoomFactor(): number {
		return 1 + Math.random() * 0.5; // Random boost factor between 0% and 50%
	}

	private getRandomRecessionFactor(): number {
		return 0.5 + Math.random() * 0.5; // Random reduction factor between 50% and 100%
	}
}
