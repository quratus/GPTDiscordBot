# sqncr / Discord OpenAI Bot

A Discord bot that interfaces with OpenAI to provide responses based on user roles (Free Trial or Pro) in a server.

## Features

*Grant "Free Trial" users a limited number of tokens to interact with the bot.
*"Pro" users can have unlimited access and their token count can go negative.
*Users interact with the bot in private threads.

## Prerequisites

*Node.js
*Discord.js library
*A Discord application and bot token.
*OpenAI API key.

## Setup

Clone the Repo

git clone [URL of your git repo]
cd [name of your repo directory]

### Install Dependencies
npm install

### Environment Configuration
Use the .envexample file in the root directory and populate it with the necessary ID's and token:

DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
CLIENT_ID=YOUR_BOTS_CLIENT_ID
GUILD_ID=YOUR_BOTS_GUILD_ID


### Adjust Role IDs
In bot.js, adjust the RoleID1 and RoleID2 variables to the corresponding Role IDs from your Discord server.

### Start the Bot

node bot.js

## Usage

Assign users either the "Free" or "Pro" role in your Discord server.
Users should interact with the bot in private threads.
Depending on their role, the bot will respond accordingly.

## Token Management

The tokenManager.js handles user tokens:

For "Free Trial" users: They are granted 30 tokens initially. Every interaction consumes a token. Once out of tokens, they're prompted to upgrade.
For "Pro" users: Every interaction reduces their token count by 1, allowing for a negative balance.
