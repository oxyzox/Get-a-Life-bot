const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Show all available commands',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setColor('#8E44AD')
            .setTitle('🤖 Get a Life Bot - Commands')
            .setDescription('Welcome to the Life Simulator! Here are all available commands:')
            .addFields(
                {
                    name: '👤 Profile & Stats',
                    value: '`!profile` - View your life profile\n`!stats` - View detailed statistics\n`!inventory` - View your items\n`!inventory use <item>` - Use an item',
                    inline: true
                },
                {
                    name: '💼 Work & Jobs',
                    value: '`!work` - Work your job to earn money\n`!jobs` - View available jobs\n`!jobs apply <job>` - Apply for a job\n`!rest` - Restore your energy',
                    inline: true
                },
                {
                    name: '🛒 Shopping',
                    value: '`!shop` - Browse shop categories\n`!shop <category>` - View items in category\n`!shop buy <item>` - Buy an item',
                    inline: true
                },
                {
                    name: '🎮 Activities',
                    value: '`!daily` - View daily challenges\n`!weekly` - View weekly quests\n`!event` - View special events\n`!duel @user` - Challenge someone to a duel\n`!gamble <game> <amount>` - Try your luck at casino games',
                    inline: true
                },
                {
                    name: '👥 Social',
                    value: '`!friend add @user` - Send friend request\n`!friend list` - View friends\n`!gift @user <item>` - Send a gift\n`!relationship` - Real player relationships\n`!reply <message>` - Reply to partner\n`!leaderboard [type]` - View rankings',
                    inline: true
                },
                {
                    name: '📊 Information',
                    value: '`!help` - Show this help menu\n`!about` - About the bot',
                    inline: true
                },
                {
                    name: '⚙️ Admin (Administrators Only)',
                    value: '`!admin channel add #channel` - Allow commands in channel\n`!admin channel remove #channel` - Disable commands in channel\n`!admin channel list` - View allowed channels',
                    inline: false
                }
            )
            .setFooter({ text: 'Get a Life Bot - Live your virtual life!' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};