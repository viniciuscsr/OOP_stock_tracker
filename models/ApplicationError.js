class ApplicationError extends Error {
  constructor(message, status) {
    super();
    this.message = message || 'Something went wrong. Please try again.';
    this.status = status || 500;
  }
}

module.exports = ApplicationError;
