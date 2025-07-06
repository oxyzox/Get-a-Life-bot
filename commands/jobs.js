const { EmbedBuilder } = require('discord.js');
const { ensureUser, formatMoney, calculateLevel } = require('../utils/gameUtils');
const { jobs } = require('../data/gameData');

module.exports = {
    name: 'jobs',
    description: 'View available jobs and apply for them',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        const userLevel = calculateLevel(user.experience);
        
        if (args.length === 0) {
            // Show all jobs
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('💼 Available Jobs')
                .setDescription('Use `!jobs apply <job_name>` to apply for a job!\n\n');
            
            let jobsList = '';
            for (const [key, job] of Object.entries(jobs)) {
                if (key === 'unemployed') continue;
                
                const available = userLevel >= job.requirement;
                const status = available ? '✅' : '❌';
                const levelReq = job.requirement > 0 ? ` (Level ${job.requirement})` : '';
                
                jobsList += `${status} **${job.name}**${levelReq}\n`;
                jobsList += `💰 Salary: ${formatMoney(job.salary)}/hour\n`;
                jobsList += `📝 ${job.description}\n\n`;
            }
            
            embed.setDescription(embed.data.description + jobsList);
            embed.setFooter({ text: `Your current level: ${userLevel} | Current job: ${jobs[user.job].name}` });
            
            return message.reply({ embeds: [embed] });
        }
        
        if (args[0].toLowerCase() === 'apply' && args[1]) {
            const jobName = args[1].toLowerCase();
            const job = jobs[jobName];
            
            if (!job || jobName === 'unemployed') {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Invalid Job')
                    .setDescription('That job doesn\'t exist! Use `!jobs` to see available positions.')
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (userLevel < job.requirement) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Not Qualified')
                    .setDescription(`You need to be level ${job.requirement} to apply for this job!\n**Your level:** ${userLevel}`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            if (user.job === jobName) {
                const embed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('❌ Already Employed')
                    .setDescription(`You already work as a ${job.name}!`)
                    .setTimestamp();
                
                return message.reply({ embeds: [embed] });
            }
            
            // Apply for the job
            const { updateUser } = require('../database/database');
            await updateUser(user.id, { job: jobName });
            
            const embed = new EmbedBuilder()
                .setColor('#4CAF50')
                .setTitle('🎉 Job Application Successful!')
                .setDescription(`Congratulations! You've been hired as a **${job.name}**!`)
                .addFields(
                    {
                        name: '💰 Salary',
                        value: `${formatMoney(job.salary)}/hour`,
                        inline: true
                    },
                    {
                        name: '📝 Description',
                        value: job.description,
                        inline: false
                    }
                )
                .setFooter({ text: 'Use !work to start earning money!' })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('❌ Invalid Usage')
            .setDescription('Use `!jobs` to view jobs or `!jobs apply <job_name>` to apply!')
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};