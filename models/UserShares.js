const pool = require('../db');

class UserShares {
  constructor(symbol, userId) {
    this.symbol = symbol;
    this.userId = userId;
    this.totalShares = 0;
    this.averagePrice = 0;
  }

  async calculatingTotalShares() {
    this.totalShares = await pool.query(
      'SELECT SUM (shares) AS total FROM portifolio WHERE userid=$1 AND symbol=$2',
      [this.userId, this.symbol]
    );
    return this.totalShares.rows[0].total;
  }

  async avgPrice() {
    let gettingAvgPriceAndShares;
    let subTotals = [];
    let totalShares = 0;
    let totalCost = 0;

    //getting average price and number of shares for each buy transaction
    try {
      gettingAvgPriceAndShares = await pool.query(
        "SELECT avg_price, shares FROM portifolio WHERE userid=$1 AND symbol=$2 AND type='buy'",
        [this.userId, this.symbol]
      );
    } catch (err) {
      console.log(err);
    }

    //calculating total cost of each transaction and total number of shares
    try {
      for (let i = 0; i < gettingAvgPriceAndShares.rows.length; i++) {
        subTotals[i] =
          gettingAvgPriceAndShares.rows[i].avg_price *
          gettingAvgPriceAndShares.rows[i].shares;
        totalShares = totalShares + gettingAvgPriceAndShares.rows[i].shares;
      }
    } catch (err) {
      console.log(err);
    }

    // adding the subtotals
    try {
      for (let i = 0; i < subTotals.length; i++) {
        totalCost = totalCost + subTotals[i];
      }
    } catch (err) {
      console.log(err);
    }

    this.averagePrice = totalCost / totalShares;
    return this.averagePrice;
  }
}

module.exports = UserShares;
