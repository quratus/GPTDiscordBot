class ConversationHistory {
    constructor() {
      this.userHistories = new Map();
    }
  
    getHistory(userId) {
      return this.userHistories.get(userId) || [];
    }
  
    addUserMessage(userId, content) {
      const currentHistory = this.getHistory(userId);
      currentHistory.push({ role: 'user', content });
      this.userHistories.set(userId, currentHistory);
    }
  
    addAssistantMessage(userId, content) {
      const currentHistory = this.getHistory(userId);
      currentHistory.push({ role: 'assistant', content });
      this.userHistories.set(userId, currentHistory);
    }
  }
  
  module.exports = ConversationHistory;
  