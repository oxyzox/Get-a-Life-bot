const fs = require('fs');
const path = require('path');

async function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
    }
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if (command.name && command.execute) {
            client.commands.set(command.name, command);
            console.log(`✅ Loaded command: ${command.name}`);
        } else {
            console.log(`⚠️  Skipped invalid command file: ${file}`);
        }
    }
    
    console.log(`📝 Loaded ${client.commands.size} commands total`);
}

module.exports = { loadCommands };