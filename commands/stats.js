const { EmbedBuilder } = require('discord.js');
const { ensureUser, formatMoney, getStatEmoji, getProgressBar, calculateLevel, getExperienceForLevel } = require('../utils/gameUtils');
const { jobs } = require('../data/gameData');

module.exports = {
    name: 'stats',
    description: 'View your detailed life statistics',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        const currentLevel = calculateLevel(user.experience);
        const expForCurrentLevel = getExperienceForLevel(currentLevel);
        const expForNextLevel = getExperienceForLevel(currentLevel + 1);
        const expProgress = user.experience - expForCurrentLevel;
        const expNeeded = expForNextLevel - expForCurrentLevel;
        
        const job = jobs[user.job] || jobs.unemployed;
        
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle(`📊 ${message.author.username}'s Life Statistics`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                {
                    name: '💰 Financial Information',
                    value: `**Balance:** ${formatMoney(user.balance)}\n**Job:** ${job.name}\n**Hourly Rate:** ${formatMoney(job.salary)}/hour`,
                    inline: true
                },
                {
                    name: '📈 Level & Experience',
                    value: `**Level:** ${currentLevel}\n**Total XP:** ${user.experience}\n**Progress:** ${expProgress}/${expNeeded}\n${getProgressBar(expProgress, expNeeded)}`,
                    inline: true
                },
                {
                    name: '🏥 Health Status',
                    value: `${getStatEmoji('health', user.health)} **${user.health}/100**\n${getProgressBar(user.health, 100)}`,
                    inline: true
                },
                {
                    name: '😊 Happiness Level',
                    value: `${getStatEmoji('happiness', user.happiness)} **${user.happiness}/100**\n${getProgressBar(user.happiness, 100)}`,
                    inline: true
                },
                {
                    name: '⚡ Energy Level',
                    value: `${getStatEmoji('energy', user.energy)} **${user.energy}/100**\n${getProgressBar(user.energy, 100)}`,
                    inline: true
                },
                {
                    name: '⏰ Last Activities',
                    value: `**Last Work:** ${user.last_work ? new Date(user.last_work).toLocaleString() : 'Never'}\n**Last Rest:** ${user.last_rest ? new Date(user.last_rest).toLocaleString() : 'Never'}`,
                    inline: false
                }
            )
            .setFooter({ text: `Account created on ${new Date(user.created_at).toLocaleDateString()}` })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};