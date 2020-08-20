const pool = require('../db');

class UserShares {
  constructor(symbol, userId) {
    this.symbol = symbol;
    this.userId = userId;
    this.totalShares = 0;
  }

  async calculatingTotalShares() {
    this.totalShares = await pool.query(
      'SELECT SUM (shares) AS total FROM portifolio WHERE userid=$1 AND symbol=$2',
      [this.userId, this.symbol]
    );
    return this.totalShares.rows[0].total;
  }
}

module.exports = UserShares;
