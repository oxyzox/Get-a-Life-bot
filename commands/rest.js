const { EmbedBuilder } = require('discord.js');
const { ensureUser, isOnCooldown, getTimeUntilReset } = require('../utils/gameUtils');
const { updateUser } = require('../database/database');

module.exports = {
    name: 'rest',
    description: 'Rest to restore your energy',
    async execute(message, args) {
        const user = await ensureUser(message.author.id, message.author.username);
        
        // Check cooldown (30 minutes)
        if (isOnCooldown(user.last_rest, 0.5)) {
            const timeLeft = getTimeUntilReset(user.last_rest, 0.5);
            
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('⏰ Rest Cooldown')
                .setDescription(`You need to wait before resting again!\n**Time until available:** ${timeLeft}`)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        if (user.energy >= 100) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('⚡ Already Energized!')
                .setDescription('You\'re already at full energy! No need to rest.')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
        
        // Rest and restore energy
        const energyRestored = Math.min(40, 100 - user.energy);
        const newEnergy = user.energy + energyRestored;
        
        await updateUser(user.id, {
            energy: newEnergy,
            last_rest: new Date().toISOString()
        });
        
        const restActivities = [
            'You took a relaxing nap',
            'You meditated peacefully',
            'You listened to calming music',
            'You read a good book',
            'You watched your favorite show',
            'You took a warm bath',
            'You did some light stretching',
            'You enjoyed a quiet moment'
        ];
        
        const activity = restActivities[Math.floor(Math.random() * restActivities.length)];
        
        const embed = new EmbedBuilder()
            .setColor('#4CAF50')
            .setTitle('😴 Rest Complete!')
            .setDescription(`${activity} and feel refreshed!`)
            .addFields(
                {
                    name: '⚡ Energy Restored',
                    value: `+${energyRestored} Energy`,
                    inline: true
                },
                {
                    name: '📊 Current Energy',
                    value: `${newEnergy}/100`,
                    inline: true
                }
            )
            .setFooter({ text: 'Come back in 30 minutes to rest again!' })
            .setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
};