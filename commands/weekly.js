const { EmbedBuilder } = require('discord.js');
const { ensureUser, formatMoney } = require('../utils/gameUtils');
const { db, updateUser } = require('../database/database');
const { weeklyQuests } = require('../data/gameData');

module.exports = {
    name: 'weekly',
    description: 'View and complete weekly quests',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekString = weekStart.toISOString().split('T')[0];
        
        // Check if user has weekly quests for this week
        const userQuests = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM weekly_quests WHERE user_id = ? AND week = ?', [user.id, weekString], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        // If no quests for this week, generate new ones
        if (userQuests.length === 0) {
            const selectedQuests = weeklyQuests.sort(() => 0.5 - Math.random()).slice(0, 2);
            
            for (const quest of selectedQuests) {
                await new Promise((resolve, reject) => {
                    db.run('INSERT INTO weekly_quests (user_id, quest_type, target, reward, week) VALUES (?, ?, ?, ?, ?)',
                        [user.id, quest.type, quest.target, quest.reward, weekString], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
            
            // Get the new quests
            const newQuests = await new Promise((resolve, reject) => {
                db.all('SELECT * FROM weekly_quests WHERE user_id = ? AND week = ?', [user.id, weekString], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            const embed = new EmbedBuilder()
                .setColor('#9C27B0')
                .setTitle('🗓️ New Weekly Quests!')
                .setDescription('Your weekly quests have been refreshed!')
                .setTimestamp();
            
            let questList = '';
            newQuests.forEach((quest, index) => {
                const questData = weeklyQuests.find(q => q.type === quest.quest_type);
                questList += `**${index + 1}.** ${questData.description}\n`;
                questList += `Progress: ${quest.progress}/${quest.target}\n`;
                questList += `Reward: ${formatMoney(quest.reward)}\n\n`;
            });
            
            embed.setDescription(embed.data.description + '\n\n' + questList);
            
            return message.reply({ embeds: [embed] });
        }
        
        // Show current quests
        const embed = new EmbedBuilder()
            .setColor('#9C27B0')
            .setTitle('🗓️ Weekly Quests')
            .setDescription('Complete these weekly quests for bigger rewards!')
            .setTimestamp();
        
        let questList = '';
        let completedRewards = 0;
        
        for (const quest of userQuests) {
            const questData = weeklyQuests.find(q => q.type === quest.quest_type);
            const status = quest.completed ? '✅' : quest.progress >= quest.target ? '🎉' : '⏳';
            
            questList += `${status} **${questData.description}**\n`;
            questList += `Progress: ${Math.min(quest.progress, quest.target)}/${quest.target}\n`;
            questList += `Reward: ${formatMoney(quest.reward)}\n\n`;
            
            // Auto-complete if target reached but not marked as completed
            if (quest.progress >= quest.target && !quest.completed) {
                await new Promise((resolve, reject) => {
                    db.run('UPDATE weekly_quests SET completed = TRUE WHERE id = ?', [quest.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                
                completedRewards += quest.reward;
            }
        }
        
        // Award rewards for newly completed quests
        if (completedRewards > 0) {
            await updateUser(user.id, { balance: user.balance + completedRewards });
            
            embed.setDescription(embed.data.description + `\n🎉 **Congratulations!** You earned ${formatMoney(completedRewards)} for completing quests!\n\n`);
        }
        
        embed.setDescription(embed.data.description + questList);
        embed.setFooter({ text: 'Quests reset weekly on Sunday!' });
        
        message.reply({ embeds: [embed] });
    }
};