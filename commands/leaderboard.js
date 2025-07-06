const { EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../database/database');
const { formatMoney } = require('../utils/gameUtils');

module.exports = {
    name: 'leaderboard',
    description: 'View the top players in different categories',
    async execute(message, args) {
        const validTypes = ['balance', 'health', 'happiness', 'level', 'experience'];
        const type = args[0]?.toLowerCase() || 'balance';
        
        if (!validTypes.includes(type)) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Invalid Category')
                .setDescription(`Available categories: ${validTypes.join(', ')}`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        try {
            const leaderboard = await getLeaderboard(type, 10);
            
            if (leaderboard.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('📊 Leaderboard')
                    .setDescription('No players found!')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            const typeEmojis = {
                balance: '💰',
                health: '❤️',
                happiness: '😊',
                level: '⭐',
                experience: '🎯'
            };
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`${typeEmojis[type]} ${type.charAt(0).toUpperCase() + type.slice(1)} Leaderboard`)
                .setTimestamp();
            
            let leaderboardText = '';
            const medals = ['🥇', '🥈', '🥉'];
            
            leaderboard.forEach((player, index) => {
                const rank = index < 3 ? medals[index] : `${index + 1}.`;
                const value = type === 'balance' ? formatMoney(player[type]) : player[type];
                leaderboardText += `${rank} **${player.username}** - ${value}\n`;
            });
            
            embed.setDescription(leaderboardText);
            
            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Leaderboard error:', error);
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Error')
                .setDescription('Failed to load leaderboard. Please try again!')
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
};