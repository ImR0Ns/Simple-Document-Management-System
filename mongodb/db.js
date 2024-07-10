const mongoose = require("mongoose");

class Database {
  constructor() {
    this._connect();
  }
  _connect() {
    mongoose
      .connect('') //your connection
      .then(() => {
        console.log('Database connection successful');
      })
      .catch((err) => {
        console.error('Database connection failed');
      });
  }
}

module.exports = new Database();