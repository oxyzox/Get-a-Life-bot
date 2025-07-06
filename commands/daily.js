const { EmbedBuilder } = require('discord.js');
const { ensureUser, isOnCooldown, getTimeUntilReset, formatMoney } = require('../utils/gameUtils');
const { db, updateUser } = require('../database/database');
const { dailyChallenges } = require('../data/gameData');

module.exports = {
    name: 'daily',
    description: 'View and complete daily challenges',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        const today = new Date().toISOString().split('T')[0];
        
        // Check if user has daily challenges for today
        const userChallenges = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM daily_challenges WHERE user_id = ? AND date = ?', [user.id, today], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // If no challenges for today, generate new ones
        if (userChallenges.length === 0) {
            const selectedChallenges = dailyChallenges.sort(() => 0.5 - Math.random()).slice(0, 3);
            
            for (const challenge of selectedChallenges) {
                await new Promise((resolve, reject) => {
                    db.run('INSERT INTO daily_challenges (user_id, challenge_type, target, reward, date) VALUES (?, ?, ?, ?, ?)',
                        [user.id, challenge.type, challenge.target, challenge.reward, today], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            
            // Get the new challenges
            const newChallenges = await new Promise((resolve, reject) => {
                db.all('SELECT * FROM daily_challenges WHERE user_id = ? AND date = ?', [user.id, today], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            const embed = new EmbedBuilder()
                .setColor('#FF9500')
                .setTitle('🌅 New Daily Challenges!')
                .setDescription('Your daily challenges have been refreshed!')
                .setTimestamp();
            
            let challengeList = '';
            newChallenges.forEach((challenge, index) => {
                const challengeData = dailyChallenges.find(c => c.type === challenge.challenge_type);
                challengeList += `**${index + 1}.** ${challengeData.description}\n`;
                challengeList += `Progress: ${challenge.progress}/${challenge.target}\n`;
                challengeList += `Reward: ${formatMoney(challenge.reward)}\n\n`;
            });
            
            embed.setDescription(embed.data.description + '\n\n' + challengeList);
            
            return message.reply({ embeds: [embed] });
        }
        
        // Show current challenges
        const embed = new EmbedBuilder()
            .setColor('#FF9500')
            .setTitle('🎯 Daily Challenges')
            .setDescription('Complete these challenges to earn rewards!')
            .setTimestamp();
        
        let challengeList = '';
        let completedRewards = 0;
        
        for (const challenge of userChallenges) {
            const challengeData = dailyChallenges.find(c => c.type === challenge.challenge_type);
            const status = challenge.completed ? '✅' : challenge.progress >= challenge.target ? '🎉' : '⏳';
            
            challengeList += `${status} **${challengeData.description}**\n`;
            challengeList += `Progress: ${Math.min(challenge.progress, challenge.target)}/${challenge.target}\n`;
            challengeList += `Reward: ${formatMoney(challenge.reward)}\n\n`;
            
            // Auto-complete if target reached but not marked as completed
            if (challenge.progress >= challenge.target && !challenge.completed) {
                await new Promise((resolve, reject) => {
                    db.run('UPDATE daily_challenges SET completed = TRUE WHERE id = ?', [challenge.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                completedRewards += challenge.reward;
            }
        }
        
        // Award rewards for newly completed challenges
        if (completedRewards > 0) {
            await updateUser(user.id, { balance: user.balance + completedRewards });
            
            embed.setDescription(embed.data.description + `\n🎉 **Congratulations!** You earned ${formatMoney(completedRewards)} for completing challenges!\n\n`);
        }
        
        embed.setDescription(embed.data.description + challengeList);
        embed.setFooter({ text: 'Challenges reset daily at midnight!' });
        
        message.reply({ embeds: [embed] });
    }
};