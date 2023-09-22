require('dotenv').config();
const Discord = require('discord.js');
const { GatewayIntentBits } = Discord;
const token = process.env.BOT_TOKEN;
const prefix = process.env.PREFIX || '!';
const axios = require('axios');
const ConversationHistory = require('./conversationHistory');
const conversationHistory = new ConversationHistory();
const roles = require('./systemRoles');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const TokenManager = require('./tokenManager');
const tokenManager = new TokenManager();




const client = new Discord.Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

axios.defaults.baseURL = 'https://api.openai.com/v1/chat/completions';
axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;
axios.defaults.headers.post['Content-Type'] = 'application/json';



client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.isThread() && message.content.trim() !== '') {
    const freeTrialRoleID = 'ROLEID1';
    const proRoleID = 'ROLEID2';
    const hasFreeTrialRole = message.member.roles.cache.has(freeTrialRoleID);
    const hasProRole = message.member.roles.cache.has(proRoleID);

    let shouldProcessMessage = false;

    if (hasFreeTrialRole && !hasProRole) {
      tokenManager.grantFreeTrialTokens(message.author.id);

      if (tokenManager.getUserTokens(message.author.id) > 0) {
        tokenManager.consumeToken(message.author.id);
        shouldProcessMessage = true;
      } else {
        return message.channel.send(
          'You have no tokens left. Please consider a membership to continue using this bot.'
        );
      }
    }

    if (hasProRole) {
      tokenManager.proConsumeToken(message.author.id);
      shouldProcessMessage = true;
    }

    if (shouldProcessMessage) {
      // Retrieve the role based on the thread name
      const role = message.channel.name.startsWith('sequence') ? 'sequenceAssistant' : 'processAssistant';
    

      // Get the current token count
      const currentTokens = tokenManager.getUserTokens(message.author.id);

      // Defer the reply to let the user know the bot is processing the request
      const deferMessage = await message.channel.send(`Processing your message... ${hasProRole ? '' : `Free Trial Version - ${currentTokens} tokens remaining`}`);

      // Make the API call to OpenAI using the askGPT function
      const resultChunks = await askGPT(message.author.id, message.content, role);

      // Delete the defer message
      await deferMessage.delete();

      // Send the result chunks as messages
      for (const chunk of resultChunks) {
        if (chunk.length > 0) { // Add this condition to avoid sending empty messages
          message.channel.send(chunk);
        }
      }
    }
  }
});







  

   

async function askGPT(userId, question, role) {
  try {
    conversationHistory.addUserMessage(userId, question);

    const response = await axios.post('', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: roles[role],
        },
        ...conversationHistory.getHistory(userId),
      ],
      temperature: 0.1,
      max_tokens: 1056,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const answer = response.data.choices[0].message.content.trim();
    conversationHistory.addAssistantMessage(userId, answer);

    return splitMessage(answer);
  } catch (err) {
    console.error(err);
    return ["I'm sorry, I couldn't generate a response."];
  }
}

function splitMessage(message) {
  const maxLength = 500;
  const chunks = [];

  while (message.length > 0) {
    let endIndex = maxLength;
    if (message.length > maxLength) {
      endIndex = message.slice(0, maxLength).lastIndexOf(' ');
      endIndex = endIndex === -1 ? maxLength : endIndex;
    }
    chunks.push(message.slice(0, endIndex).trim());
    message = message.slice(endIndex).trim();
  }

  return chunks;
}




client.login(token);

client.once('ready', () => {
  console.log('Bot is online!');
});

client.on('guildCreate', async (guild) => {
  // Find the "general" channel in the guild's channels
  const generalChannel = guild.channels.cache.find(channel => channel.name.toLowerCase() === 'general' && channel.type === 'GUILD_TEXT');

  // Use the general channel, or fall back to the guild's system channel
  const targetChannel = generalChannel || guild.systemChannel;

  if (targetChannel) {
    await targetChannel.send('Greetings!');
  } else {
    console.log(`Could not find a suitable channel in the guild: ${guild.name}`);
  }
});



// bot.js
const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');

const commands = [
/*new SlashCommandBuilder()
    .setName('process')
    .setDescription('Ask the Process Assistant!')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Your question')
        .setRequired(true)
    ),*/
  new SlashCommandBuilder()
    .setName('Ask')
    .setDescription('Ask the Assistant!')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Your question')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help'),
];


const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands.map((command) => command.toJSON()) }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();


client.once('ready', async () => {
  const commandData = commands.map((command) => command.toJSON());
  await client.guilds.cache.get(process.env.GUILD_ID).commands.set(commandData);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'process' || commandName === 'sequence') {
    // Defer the reply to let the user know the bot is processing the request
    await interaction.deferReply({ ephemeral: true });

    // Define the role based on the commandName
    const role = commandName === 'process' ? 'Assistant1' : 'Assistant2';

    

    // Create a private thread for the user and the bot
    const thread = await interaction.channel.threads.create({
      name: `${commandName}-${interaction.user.username}`,
      autoArchiveDuration: 60,
      type: 12, // Use the numeric value for GUILD_PRIVATE_THREAD
    });

    // Add the user to the private thread
    await thread.members.add(interaction.user.id);

    // Acknowledge the command
    await interaction.editReply(`Created a private thread for you to interact with the ${commandName} bot. Check your threads!`);

    if (commandName === 'sequence') {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (tokenManager.hasFreeTrialRole(member)) {
        await tokenManager.grantFreeTrialTokens(interaction.user.id);
      }
    }
    

    // Get the user's question from the slash command
    const userQuestion = interaction.options.getString('question');
    if (userQuestion && userQuestion.trim() !== '') {
      const resultChunks = await askGPT(interaction.user.id, userQuestion, role);

     // Send a welcome message in the private thread
     await thread.send(`Welcome to the ${commandName} bot! Please type your question below.`);
     
      // Send the result chunks as messages
      for (const chunk of resultChunks) {
        if (chunk.length > 0) { // Add this condition to avoid sending empty messages
          thread.send(chunk);
        }
      }
    } else {
      // Send a welcome message in the private thread
      await thread.send(`Welcome to the ${commandName} bot! `);
    }
  }
});