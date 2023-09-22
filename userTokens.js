const fs = require('fs');
const path = require('path');

const tokensFile = path.join(__dirname, 'userTokens.json');

// Load existing user tokens or create a new empty object
const userTokens = fs.existsSync(tokensFile)
  ? JSON.parse(fs.readFileSync(tokensFile, 'utf8'))
  : {};

function saveTokens() {
  fs.writeFileSync(tokensFile, JSON.stringify(userTokens), 'utf8');
}

function initializeUser(userId) {
  if (!userTokens[userId]) {
    userTokens[userId] = {
      tokens: 2, // Set the initial token balance for a new user
    };
    saveTokens();
  }
}

function hasTokens(userId) {
  return userTokens[userId] && userTokens[userId].tokens > 0;
}

function consumeToken(userId) {
  if (hasTokens(userId)) {
    userTokens[userId].tokens -= 1;
    saveTokens();
  }
}

module.exports = {
  initializeUser,
  hasTokens,
  consumeToken,
};
