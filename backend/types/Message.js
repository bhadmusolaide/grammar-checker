class Message {
  constructor(sessionId, role, content, attachments) {
    this.id = Date.now().toString();
    this.sessionId = sessionId;
    this.role = role;
    this.content = content;
    this.attachments = attachments || undefined;
    this.timestamp = new Date().toISOString();
  }
}

module.exports = Message;
