CREATE TABLE IF NOT EXISTS UserPets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    pet_id TEXT,
    pet_type TEXT, -- cat, dog, fish, bird, turtle
    hunger INTEGER DEFAULT 100,
    happiness INTEGER DEFAULT 100,
    health INTEGER DEFAULT 100,
    energy INTEGER DEFAULT 100,
    is_sleeping BOOLEAN DEFAULT FALSE,
    is_dead BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS UserCatches (
  catch_id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT, -- fish or treasure
  name TEXT,
  weight REAL DEFAULT NULL,
  rarity TEXT,
  price REAL DEFAULT NULL,
  caught_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
