const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'lifebot.db');
const db = new sqlite3.Database(dbPath);

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                balance INTEGER DEFAULT 1000,
                health INTEGER DEFAULT 100,
                happiness INTEGER DEFAULT 100,
                energy INTEGER DEFAULT 100,
                job TEXT DEFAULT 'unemployed',
                experience INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                last_work DATETIME,
                last_rest DATETIME,
                last_daily DATETIME,
                last_weekly DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Inventory table
            db.run(`CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                item_name TEXT NOT NULL,
                quantity INTEGER DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Friends table
            db.run(`CREATE TABLE IF NOT EXISTS friends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                friend_id TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (friend_id) REFERENCES users (id)
            )`);

            // Daily challenges table
            db.run(`CREATE TABLE IF NOT EXISTS daily_challenges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                challenge_type TEXT NOT NULL,
                progress INTEGER DEFAULT 0,
                target INTEGER NOT NULL,
                reward INTEGER NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                date TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Weekly quests table
            db.run(`CREATE TABLE IF NOT EXISTS weekly_quests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                quest_type TEXT NOT NULL,
                progress INTEGER DEFAULT 0,
                target INTEGER NOT NULL,
                reward INTEGER NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                week TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Duel history table
            db.run(`CREATE TABLE IF NOT EXISTS duel_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                challenger_id TEXT NOT NULL,
                opponent_id TEXT NOT NULL,
                winner_id TEXT,
                bet_amount INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (challenger_id) REFERENCES users (id),
                FOREIGN KEY (opponent_id) REFERENCES users (id),
                FOREIGN KEY (winner_id) REFERENCES users (id)
            )`);

            // Allowed channels table for admin control
            db.run(`CREATE TABLE IF NOT EXISTS allowed_channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                channel_id TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, channel_id)
            )`);

            // Girlfriends table
            db.run(`CREATE TABLE IF NOT EXISTS girlfriends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                personality TEXT NOT NULL,
                hobby TEXT NOT NULL,
                age INTEGER NOT NULL,
                love INTEGER DEFAULT 50,
                happiness INTEGER DEFAULT 50,
                last_date DATETIME,
                last_gift DATETIME,
                last_talk DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Boyfriends table
            db.run(`CREATE TABLE IF NOT EXISTS boyfriends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                personality TEXT NOT NULL,
                hobby TEXT NOT NULL,
                age INTEGER NOT NULL,
                love INTEGER DEFAULT 50,
                happiness INTEGER DEFAULT 50,
                last_date DATETIME,
                last_gift DATETIME,
                last_talk DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);

            // Real relationships table for player-to-player connections
            db.run(`CREATE TABLE IF NOT EXISTS real_relationships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                requester_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                relationship_type TEXT NOT NULL,
                love INTEGER DEFAULT 0,
                happiness INTEGER DEFAULT 50,
                last_interaction DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (requester_id) REFERENCES users (id),
                FOREIGN KEY (target_id) REFERENCES users (id)
            )`);

            // Relationship messages table for player conversations
            db.run(`CREATE TABLE IF NOT EXISTS relationship_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                relationship_id INTEGER NOT NULL,
                sender_id TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (relationship_id) REFERENCES real_relationships (id),
                FOREIGN KEY (sender_id) REFERENCES users (id)
            )`);

            // Marriage proposals table
            db.run(`CREATE TABLE IF NOT EXISTS marriage_proposals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                proposer_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (proposer_id) REFERENCES users (id),
                FOREIGN KEY (target_id) REFERENCES users (id)
            )`);

            console.log('✅ Database initialized successfully');
            resolve();
        });
    });
}

// Add last_gamble column to users table if it doesn't exist
db.run(`ALTER TABLE users ADD COLUMN last_gamble DATETIME`, (err) => {
    // Ignore error if column already exists
});

function getUser(userId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function createUser(userId, username) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO users (id, username) VALUES (?, ?)', [userId, username], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

function updateUser(userId, data) {
    return new Promise((resolve, reject) => {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);
        values.push(userId);
        
        db.run(`UPDATE users SET ${fields} WHERE id = ?`, values, function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
}

function getInventory(userId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM inventory WHERE user_id = ?', [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function addInventoryItem(userId, itemName, quantity = 1) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM inventory WHERE user_id = ? AND item_name = ?', [userId, itemName], (err, row) => {
            if (err) reject(err);
            else if (row) {
                // Update existing item
                db.run('UPDATE inventory SET quantity = quantity + ? WHERE user_id = ? AND item_name = ?', 
                    [quantity, userId, itemName], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            } else {
                // Add new item
                db.run('INSERT INTO inventory (user_id, item_name, quantity) VALUES (?, ?, ?)', 
                    [userId, itemName, quantity], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            }
        });
    });
}

function removeInventoryItem(userId, itemName, quantity = 1) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE inventory SET quantity = quantity - ? WHERE user_id = ? AND item_name = ? AND quantity >= ?', 
            [quantity, userId, itemName, quantity], function(err) {
            if (err) reject(err);
            else if (this.changes === 0) reject(new Error('Not enough items'));
            else {
                // Remove item if quantity is 0
                db.run('DELETE FROM inventory WHERE user_id = ? AND item_name = ? AND quantity <= 0', 
                    [userId, itemName], function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            }
        });
    });
}

function getLeaderboard(type = 'balance', limit = 10) {
    return new Promise((resolve, reject) => {
        const validTypes = ['balance', 'health', 'happiness', 'level', 'experience'];
        if (!validTypes.includes(type)) {
            reject(new Error('Invalid leaderboard type'));
            return;
        }
        
        db.all(`SELECT username, ${type} FROM users ORDER BY ${type} DESC LIMIT ?`, [limit], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function isChannelAllowed(guildId, channelId) {
    return new Promise((resolve, reject) => {
        // First check if there are any allowed channels set for this guild
        db.get('SELECT COUNT(*) as count FROM allowed_channels WHERE guild_id = ?', [guildId], (err, row) => {
            if (err) reject(err);
            else if (row.count === 0) {
                // No restrictions set, allow all channels
                resolve(true);
            } else {
                // Check if this specific channel is allowed
                db.get('SELECT * FROM allowed_channels WHERE guild_id = ? AND channel_id = ?', 
                    [guildId, channelId], (err, row) => {
                    if (err) reject(err);
                    else resolve(!!row);
                });
            }
        });
    });
}

module.exports = {
    db,
    initializeDatabase,
    getUser,
    createUser,
    updateUser,
    getInventory,
    addInventoryItem,
    removeInventoryItem,
    getLeaderboard,
    isChannelAllowed
};