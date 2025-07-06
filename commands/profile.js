const { EmbedBuilder } = require('discord.js');
const { ensureUser, formatMoney, getStatEmoji, getProgressBar, calculateLevel, getExperienceForLevel } = require('../utils/gameUtils');
const { jobs } = require('../data/gameData');

module.exports = {
    name: 'profile',
    description: 'View your life profile',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        const currentLevel = calculateLevel(user.experience);
        const expForCurrentLevel = getExperienceForLevel(currentLevel);
        const expForNextLevel = getExperienceForLevel(currentLevel + 1);
        const expProgress = user.experience - expForCurrentLevel;
        const expNeeded = expForNextLevel - expForCurrentLevel;
        
        const job = jobs[user.job] || jobs.unemployed;
        
        const embed = new EmbedBuilder()
            .setColor('#00AE86')
            .setTitle(`${message.author.username}'s Life Profile`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                {
                    name: '💰 Financial Status',
                    value: `**Balance:** ${formatMoney(user.balance)}\n**Job:** ${job.name}`,
                    inline: true
                },
                {
                    name: '📊 Stats',
                    value: `${getStatEmoji('health', user.health)} **Health:** ${user.health}/100\n${getStatEmoji('happiness', user.happiness)} **Happiness:** ${user.happiness}/100\n${getStatEmoji('energy', user.energy)} **Energy:** ${user.energy}/100`,
                    inline: true
                },
                {
                    name: '🎯 Level & Experience',
                    value: `**Level:** ${currentLevel}\n**Experience:** ${user.experience}\n**Progress:** ${getProgressBar(expProgress, expNeeded)} ${expProgress}/${expNeeded}`,
                    inline: true
                },
                {
                    name: '📈 Progress Bars',
                    value: `**Health:** ${getProgressBar(user.health, 100)} ${user.health}%\n**Happiness:** ${getProgressBar(user.happiness, 100)} ${user.happiness}%\n**Energy:** ${getProgressBar(user.energy, 100)} ${user.energy}%`,
                    inline: false
                }
            )
            .setFooter({ text: `Life Simulator • Member since ${new Date(user.created_at).toLocaleDateString()}` })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};