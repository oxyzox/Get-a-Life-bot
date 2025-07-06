# Get a Life Bot

A comprehensive Discord life simulation bot that allows server members to build virtual lives, work jobs, manage relationships, and compete in a rich economy system.

## Important 

Wanna know what’s really going on?  
Check out [The Site](https://getalifebot.vercel.app) — the lore’s there, and it’s fun prob..

## Features

### Core Life Simulation
- Health, happiness, and energy management
- Experience points and character leveling
- Comprehensive profile system with progress tracking

### Economy System
- 11 different career paths from Cashier to CEO
- Work commands with realistic cooldowns and earnings
- Comprehensive shop with 6 categories and 40+ items
- Inventory management with consumable items

### Social Features
- Friend system with requests and management
- Gift system for sharing items between friends
- Real player relationships with dating and marriage
- Private messaging system between partners

### Activities and Challenges
- Daily challenges with rotating objectives
- Weekly quests for long-term goals
- Seasonal events with special rewards
- Dueling system for friendly competition
- Casino games including slots, dice, blackjack, and more

### Virtual Relationships
- AI girlfriend/boyfriend system with personalities
- Real player dating with proposal and marriage mechanics
- Relationship progression through dates, gifts, and communication

### Competition
- Leaderboards for wealth, health, happiness, and level
- Achievement system with milestone rewards
- Duel history and statistics tracking

## Installation

1. Clone the repository
```bash
git clone https://github.com/oxyzox/get-a-life-bot.git
cd get-a-life-bot
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your Discord bot token
```

4. Start the bot
```bash
npm start
```

## Configuration

Create a Discord application at https://discord.com/developers/applications and get your bot token. Set the `BOT_TOKEN` environment variable in your `.env` file.

Required permissions:
- Send Messages
- Read Message History
- Use External Emojis
- Add Reactions
- Embed Links

## Commands

### Basic Commands
- `!profile` - View your character profile
- `!stats` - Detailed statistics and progress
- `!help` - List all available commands

### Economy
- `!work` - Work your job to earn money
- `!jobs` - View and apply for jobs
- `!shop` - Browse and purchase items
- `!inventory` - Manage your items

### Social
- `!friend add @user` - Send friend request
- `!gift @user item` - Send items to friends
- `!relationship` - Manage real player relationships
- `!girlfriend` / `!boyfriend` - Virtual AI relationships

### Activities
- `!daily` - Complete daily challenges
- `!weekly` - View weekly quests
- `!gamble game amount` - Casino games
- `!duel @user amount` - Challenge players

### Information
- `!leaderboard type` - View rankings
- `!about` - Bot information

## Database

The bot uses SQLite for data persistence with the following main tables:
- Users (profiles, stats, economy)
- Inventory (item storage)
- Friends (social connections)
- Relationships (dating system)
- Daily/Weekly challenges

## Architecture

- **Discord.js v14** - Discord API interaction
- **SQLite3** - Local database storage
- **Modular Commands** - Organized command structure
- **Rich Embeds** - Beautiful message formatting
- **Cooldown System** - Balanced gameplay mechanics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

under oxyzox.

## Support

For issues and feature requests, please use the GitHub issue tracker.

