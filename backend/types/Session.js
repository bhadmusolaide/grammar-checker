class Session {
  constructor(title, model) {
    this.id = Date.now().toString();
    this.title = title || 'New Chat';
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.model = model || null;
  }
}

module.exports = Session;
