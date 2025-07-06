const { EmbedBuilder } = require('discord.js');
const { ensureUser, getRandomInt, formatMoney, isOnCooldown, getTimeUntilReset } = require('../utils/gameUtils');
const { updateUser } = require('../database/database');
const { jobs } = require('../data/gameData');

module.exports = {
    name: 'work',
    description: 'Work your job to earn money',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        // Check cooldown (1 hour)
        if (isOnCooldown(user.last_work, 1)) {
            const timeLeft = getTimeUntilReset(user.last_work, 1);
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('⏰ Work Cooldown')
                .setDescription(`You need to rest before working again!\n**Time until available:** ${timeLeft}`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Check energy
        if (user.energy < 20) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('😴 Too Tired!')
                .setDescription('You need at least 20 energy to work. Use `!rest` to restore your energy!')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const job = jobs[user.job] || jobs.unemployed;
        
        if (job.salary === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ No Job!')
                .setDescription('You need a job to work! Use `!jobs` to see available positions.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Calculate earnings with some randomness
        const baseEarnings = job.salary;
        const randomMultiplier = getRandomInt(80, 120) / 100; // 80% to 120% of base salary
        const earnings = Math.floor(baseEarnings * randomMultiplier);
        
        // Calculate experience gained
        const experienceGained = getRandomInt(10, 25);
        
        // Update user stats
        const newBalance = user.balance + earnings;
        const newEnergy = Math.max(0, user.energy - 20);
        const newExperience = user.experience + experienceGained;
        
        await updateUser(user.id, {
            balance: newBalance,
            energy: newEnergy,
            experience: newExperience,
            last_work: new Date().toISOString()
        });
        
        // Work scenarios for flavor text
        const workScenarios = [
            'You had a productive day at work!',
            'You impressed your boss with your dedication!',
            'You helped a colleague with their project!',
            'You completed all your tasks efficiently!',
            'You learned something new on the job!',
            'You received positive feedback from customers!',
            'You collaborated well with your team!',
            'You solved a challenging problem!'
        ];
        
        const scenario = workScenarios[getRandomInt(0, workScenarios.length - 1)];
        
        const embed = new EmbedBuilder()
            .setColor('#4CAF50')
            .setTitle('💼 Work Complete!')
            .setDescription(`**Job:** ${job.name}\n${scenario}`)
            .addFields(
                {
                    name: '💰 Earnings',
                    value: `+${formatMoney(earnings)}`,
                    inline: true
                },
                {
                    name: '⭐ Experience',
                    value: `+${experienceGained} XP`,
                    inline: true
                },
                {
                    name: '⚡ Energy',
                    value: `-20 Energy`,
                    inline: true
                },
                {
                    name: '📊 Updated Stats',
                    value: `**Balance:** ${formatMoney(newBalance)}\n**Energy:** ${newEnergy}/100\n**Experience:** ${newExperience}`,
                    inline: false
                }
            )
            .setFooter({ text: 'Come back in 1 hour to work again!' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};