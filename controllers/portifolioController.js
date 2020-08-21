const portifolioController = {};

const pool = require('../db');
const axios = require('axios');
const portifolioMetrics = require('../customFunctions/totals');
const UserShares = require('../models/UserShares');

// -----------------
// PORTIFOLIO INDEX
// -----------------

portifolioController.portifolioIndex = async (req, res) => {
  let userId = req.user.id;
  // Getting all symbols from transactions by a specific user
  let dbStock;
  try {
    dbStock = await pool.query(
      'SELECT symbol, shares FROM portifolio WHERE userid=$1',
      [req.user.id]
    );
  } catch (err) {
    console.log(err);
  }
  let portifolioArray = [];

  //Loop to create the array with each symbol in the transactions table

  for (let index = 0; index < dbStock.rows.length; index++) {
    let ticker = dbStock.rows[index].symbol;
    let duplicatedSymbol = portifolioArray.find(
      ({ symbol }) => symbol === ticker
    );
    // Removing duplicated symbols
    if (typeof duplicatedSymbol !== 'undefined') {
      continue;
    }
    // Calculating total of shares for each symbol in the portifolio

    let userShares;
    try {
      userShares = new UserShares(ticker, userId);
      await userShares.calculatingTotalShares();
      // Fetching the current price from an external API
      let endOfDayPriceApi;
      try {
        endOfDayPriceApi = await axios.get(
          `https://api.tiingo.com/tiingo/daily/${ticker}/prices?token=${process.env.TIINGO_TOKEN}`
        );
      } catch (err) {
        console.log(err);
      }
      // Final object
      let finalStock = {
        symbol: ticker,
        totalShares: userShares.totalShares.rows[0].total,
        currentPrice: endOfDayPriceApi.data[0].adjClose,
      };
      // Pushing the final stock object to the array
      portifolioArray.push(finalStock);
    } catch (err) {
      console.log(err);
    }
  }
  res.render('stock/portifolio', {
    portifolio: portifolioArray,
  });
};

// -----------------
// NEW TRANSACTION
// -----------------

portifolioController.getNewTransaction = (req, res) => {
  res.render('stock/newTransaction');
};

portifolioController.postNewTransaction = (req, res) => {
  let { symbol, shares, avgPrice, type } = req.body;
  // Reversing the shares sign if equals to sell
  if (type === 'sell') {
    shares = shares * -1;
  }
  // Inserting transaction into the db
  pool.query(
    'INSERT INTO portifolio(symbol, shares, avg_price, userid, type) VALUES($1, $2, $3, $4, $5)',
    [symbol, shares, avgPrice, req.user.id, type],
    (err, result) => {
      if (err) {
        console.log(err);
      }
      res.redirect('/portifolio/');
    }
  );
};

// -----------------
// UPDATE TRANSACTION
// -----------------

portifolioController.getUpdateTransaction = async (req, res) => {
  let transaction;
  try {
    transaction = await pool.query(
      'SELECT * FROM portifolio WHERE transactionid=($1)',
      [req.params.transactionid]
    );
  } catch (err) {
    console.log(err);
  }
  res.render('stock/update', { transaction: transaction.rows[0] });
};

portifolioController.patchUpdateTransaction = (req, res) => {
  const { shares, avgPrice, type } = req.body;

  pool.query(
    'UPDATE portifolio SET shares=($1), avg_price=($2), type=($3) WHERE transactionid=($4)',
    [shares, avgPrice, type, req.params.transactionid],
    (err, result) => {
      if (err) {
        console.log(err);
      }
      res.redirect('/portifolio/');
    }
  );
};

// -----------------
// DELETE TRANSACTION
// -----------------

portifolioController.deleteTransaction = (req, res) => {
  pool.query(
    'DELETE FROM portifolio WHERE transactionid=($1)',
    [req.params.transactionid],
    (err, result) => {
      if (err) {
        console.log(err);
      }
      res.redirect('/portifolio/');
    }
  );
};

// -----------------
// SHOW PAGE
// -----------------

portifolioController.stockShowPage = async (req, res) => {
  const upperSymbol = req.params.symbol.toUpperCase();
  const userId = req.user.id;
  let dbStock;

  //finding the stock info in the DB
  try {
    dbStock = await pool.query(
      'SELECT * FROM portifolio WHERE userid=$1 AND symbol=$2',
      [req.user.id, upperSymbol]
    );
  } catch (err) {
    console.log(err);
  }
  if (dbStock.rows.length === 0) {
    return res.json({ message: 'Stock not found' });
  }

  // getting data from the stock api
  let endOfDayPriceApi;
  try {
    endOfDayPriceApi = await axios.get(
      `https://api.tiingo.com/tiingo/daily/${upperSymbol}/prices?token=${process.env.TIINGO_TOKEN}`
    );
  } catch (err) {
    console.log(err);
  }

  //getting data from the stock news api
  let stockNews;

  try {
    stockNews = await axios.get(
      `https://newsapi.org/v2/everything?q=${upperSymbol}&language=en&domains=finance.yahoo.com,fool.com,cnbc.com,investors.com&apiKey=${process.env.NEWS_API_KEY}`
    );
  } catch (err) {
    console.log(err);
  }

  // total shares

  let userShares;
  try {
    userShares = new UserShares(upperSymbol, userId);
    await userShares.calculatingTotalShares();
  } catch (err) {
    console.log(err);
  }

  // total average price - weighted average

  try {
    await userShares.avgPrice();
  } catch (err) {
    console.log(err);
  }

  const stockObj = {
    symbol: upperSymbol,
    currentPrice: endOfDayPriceApi.data[0].adjClose,
    shares: userShares.totalShares.rows[0].total,
    avgPrice: userShares.averagePrice,
    news: stockNews.data.articles,
    transactions: dbStock.rows,
  };

  res.render('stock/stock', { stock: stockObj });
};

module.exports = portifolioController;
