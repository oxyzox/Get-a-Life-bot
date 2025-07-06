const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActivityType } = require('discord.js');
const { initializeDatabase, isChannelAllowed } = require('./database/database');
const { loadCommands } = require('./utils/commandLoader');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();



client.once('ready', async () => {
    console.log(`🤖 ${client.user.tag} is online and ready!`);
    
    // Initialize database
    await initializeDatabase();
    
    // Load commands
    await loadCommands(client);
    
    // Set bot activity
    const activities = [
        { name: 'virtual lives', type: ActivityType.Streaming, url: 'https://twitch.tv/getalifebot' },
    ];
    
    let currentActivity = 0;
    setInterval(() => {
        client.user.setActivity(activities[currentActivity]);
        currentActivity = (currentActivity + 1) % activities.length;
    }, 30000); // Change activity every 30 seconds
    
    // Set initial activity
    client.user.setActivity(activities[0]);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    
    // Check if commands are allowed in this channel (skip for admin command)
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    if (commandName !== 'admin' && message.guild) {
        const channelAllowed = await isChannelAllowed(message.guild.id, message.channel.id);
        if (!channelAllowed) {
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Commands Disabled')
                .setDescription('Bot commands are not allowed in this channel!\nAsk an administrator to enable commands here with `!admin channel add #channel`')
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
    }
    
    const command = client.commands.get(commandName);
    if (!command) return;
    
    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription('Something went wrong while executing this command!')
            .setTimestamp();
            
        message.reply({ embeds: [errorEmbed] });
    }
});

// Error handling
client.on('error', console.error);
client.on('warn', console.warn);

const token = process.env.BOT_TOKEN || 'your_bot_token';

if (token === 'YOUR_BOT_TOKEN_HERE') {
    console.log('⚠️  Please set your bot token in the BOT_TOKEN environment variable or replace it in index.js');
    process.exit(1);
}

client.login(token);