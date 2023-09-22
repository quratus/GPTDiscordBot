const fs = require('fs');
const userTokensPath = './userTokens.json';

class TokenManager {
  constructor() {
    this.loadUserTokens();
  }

  loadUserTokens() {
    try {
      const data = fs.readFileSync(userTokensPath, 'utf8');
      this.userTokens = JSON.parse(data);
    } catch (err) {
      console.error(err);
      this.userTokens = {};
    }
  }

  saveUserTokens() {
    fs.writeFileSync(userTokensPath, JSON.stringify(this.userTokens, null, 2), 'utf8');
  }

  getUserTokens(userId) {
    return this.userTokens[userId] || 0;
  }

  setUserTokens(userId, tokens) {
    this.userTokens[userId] = tokens;
    this.saveUserTokens();
  }

  hasFreeTrialRole(member) {
    return member.roles.cache.some((role) => role.name === 'Free Trial');
  }

  async consumeToken(userId) {
    let tokens = this.getUserTokens(userId);
  
    if (tokens === 0) {
      return false;
    }
  
    tokens -= 1;
    this.setUserTokens(userId, tokens);
  
    return tokens > 0; // Return false if tokens have reached 0 after consumption
  }
  
  async proConsumeToken(userId) {
    let tokens = this.getUserTokens(userId);
    tokens -= 1;
    this.setUserTokens(userId, tokens);
  }

  async grantFreeTrialTokens(userId) {
    if (!this.userTokens.hasOwnProperty(userId)) {
      this.setUserTokens(userId, 30);
    }
  }
}

module.exports = TokenManager;
