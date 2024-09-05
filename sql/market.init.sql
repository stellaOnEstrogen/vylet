CREATE TABLE IF NOT EXISTS Transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- 'earn', 'spend', 'transfer', 'tax', 'interest'
    amount REAL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS Market (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT,
    base_price REAL, -- Changed from DECIMAL to REAL
    current_price REAL,
    demand INTEGER DEFAULT 0,
    supply INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Inflation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rate REAL DEFAULT 0.00,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS EconomicEvents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT, -- 'boom', 'recession', 'grant'
    details TEXT, -- Additional details about the event
    impact REAL, -- Numeric value of the impact (e.g., % change in prices)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS MarketPriceHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER,
    price REAL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES Market(id)
);
