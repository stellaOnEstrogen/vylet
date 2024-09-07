import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * Singleton class for managing the application's SQLite database.
 */
class AppDB {
	private static instance: AppDB | null = null;
	private db: sqlite3.Database;

	private constructor() {
		const dbPath = path.join(__dirname, '..', '..', 'db', 'app.db');

		const dbDir = path.join(__dirname, '..', '..', 'db');

		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir);
		}

		this.db = new sqlite3.Database(
			dbPath,
			sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
			(err) => {
				if (err) {
					console.error('Error opening database:', err);
				} else {
					this.checkAndApplyMigrations();
				}
			},
		);
	}

	public static getInstance(): AppDB {
		if (!AppDB.instance) {
			AppDB.instance = new AppDB();
		}
		return AppDB.instance;
	}

	public close(): void {
		this.db.close((err) => {
			if (err) {
				console.error('Error closing database:', err);
			}
		});
	}

	public static destroy(): void {
		if (AppDB.instance) {
			AppDB.instance.close();
		}
		AppDB.instance = null;
	}

	public getDb(): sqlite3.Database {
		return this.db;
	}

	/**
	 * Executes a SQL query with the given template literals and parameters.
	 *
	 * @template T The type of the result rows.
	 * @param {TemplateStringsArray} strings The SQL query template strings.
	 * @param {...any[]} values The values to interpolate into the SQL query.
	 * @returns {Promise<T[]>} A promise that resolves to an array of result rows.
	 */
	public async query<T = any>(
		strings: TemplateStringsArray,
		...values: any[]
	): Promise<T[]> {
		// Construct the query string by joining template literals
		const query = strings.reduce(
			(prev, curr, i) => prev + curr + (i < values.length ? '?' : ''),
			'',
		);

		return new Promise((resolve, reject) => {
			this.db.all(query, values, (err, rows) => {
				if (err) {
					console.error('Database query error:', err);
					reject(err);
				} else {
					// Format rows if needed (handling JSON strings)
					const formattedRows = rows.map((row) => {
						if (typeof row === 'object' && row !== null) {
							for (const key in row) {
								if (typeof row[key as keyof typeof row] === 'string') {
									try {
										const parsed = JSON.parse(row[key as keyof typeof row]);
										(row as any)[key] = parsed;
									} catch (e) {
										// Leave it as a string if it's not JSON
									}
								}
							}
						}
						return row;
					});
					resolve(formattedRows as T[]);
				}
			});
		});
	}

	/**
	 * Executes a raw SQL query with the given parameters.
	 *
	 * @template T The type of the result rows.
	 * @param {string} query The SQL query string.
	 * @param {any[]} [values=[]] The values to interpolate into the SQL query.
	 * @returns {Promise<T[]>} A promise that resolves to an array of result rows.
	 */
	public async queryRaw<T = any>(
		query: string,
		values: any[] = [],
		formatJson = true,
	): Promise<T[]> {
		return new Promise((resolve, reject) => {
			this.db.all(query, values, (err, rows) => {
				if (err) {
					console.error('Database query error:', err);
					reject(err);
				} else {
					if (!formatJson) {
						resolve(rows as T[]);
						return;
					}
					const formattedRows = rows.map((row) => {
						if (typeof row === 'object' && row !== null) {
							for (const key in row) {
								if (typeof row[key as keyof typeof row] === 'string') {
									try {
										const parsed = JSON.parse(row[key as keyof typeof row]);
										(row as any)[key] = parsed;
									} catch (e) {
										// Leave it as a string if it's not JSON
									}
								}
							}
						}
						return row;
					});
					resolve(formattedRows as T[]);
				}
			});
		});
	}

	public async queryNoJson(query: string, values: any[] = []): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.all(query, values, (err, rows) => {
				if (err) {
					console.error('Database query error:', err);
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
	}

	private async checkAndApplyMigrations(): Promise<void> {
		try {
			const initSQLPath = path.join(__dirname, '..', '..', 'sql');
			const initFiles = fs
				.readdirSync(initSQLPath)
				.filter((file) => file.endsWith('.init.sql'));

			for (const file of initFiles) {
				const sql = fs.readFileSync(path.join(initSQLPath, file), 'utf-8');
				await this.applyMigration(sql);
			}
		} catch (error) {
			console.error('Error checking and applying migrations:', error);
		}
	}

	private async applyMigration(sql: string): Promise<void> {
		const statements = sql
			.split(';')
			.filter((statement) => statement.trim() !== '');
		for (const statement of statements) {
			await new Promise<void>((resolve, reject) => {
				this.db.run(statement, [], (err) => {
					if (err) {
						console.error('Error applying migration:', err);
						reject(err);
					} else {
						resolve();
					}
				});
			});
		}
	}

	public async createDatabase(): Promise<void> {
		try {
			const initSQLPath = path.join(__dirname, '..', '..', 'sql');
			const initFiles = fs
				.readdirSync(initSQLPath)
				.filter((file) => file.endsWith('.init.sql'));

			for (const file of initFiles) {
				const sql = fs.readFileSync(path.join(initSQLPath, file), 'utf-8');
				await this.applyMigration(sql);
			}
		} catch (error) {
			console.error('Error creating database:', error);
			throw error;
		}
	}
}

/**
 * An interface for the AppDB class.
 */
interface IAppDB {
	query<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]>;
	queryRaw<T = any>(
		query: string,
		values?: any[],
		formatJson?: boolean,
	): Promise<T[]>;
	queryNoJson(query: string, values?: any[]): Promise<any>;
	createDatabase(): Promise<void>;
}

export { AppDB, IAppDB };
