const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'about',
    description: 'Information about the bot',
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🤖 About Get a Life Bot')
            .setDescription('Get a Life Bot is a comprehensive life simulation game for Discord servers!')
            .addFields(
                {
                    name: '✨ Features',
                    value: '• **Life Simulation** - Manage health, happiness, and energy\n• **Career System** - Work different jobs to earn money\n• **Shopping & Inventory** - Buy and use items\n• **Social Features** - Make friends and send gifts\n• **Daily Challenges** - Complete tasks for rewards\n• **Leaderboards** - Compete with other players',
                    inline: false
                },
                {
                    name: '🎮 How to Play',
                    value: '1. Use `!profile` to view your character\n2. Apply for jobs with `!jobs apply <job>`\n3. Work to earn money with `!work`\n4. Buy items from the `!shop`\n5. Complete daily challenges for bonuses\n6. Compete with friends on the leaderboard!',
                    inline: false
                },
                {
                    name: '🔧 Built With',
                    value: '• Discord.js v14\n• SQLite Database\n• Node.js',
                    inline: true
                },
                {
                    name: '📈 Version',
                    value: '1.0.0',
                    inline: true
                }
            )
            .setFooter({ text: 'Made with ❤️ for Discord communities' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};