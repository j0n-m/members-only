const mongoose = require('mongoose');
require('dotenv').config();
const db = process.env.MONGODB;

async function dbConnectionTest() {
  try {
    await mongoose.connect(process.env.MONGODB);
    await mongoose.connection.close();
    console.log('[ Database is online ]');
  } catch (error) {
    console.log('[ Database ERROR ]: ' + error.errmsg);
  }
}
async function openDBConnection() {
  try {
    await mongoose.connect(db);
    console.log('Opened DB Connection');
  } catch (error) {
    console.log(error.stack)
  }
}
async function closeDBConnection() {
  try {
    await mongoose.connection.close(db);
    console.log('Closed DB Connection');
  } catch (error) {
    console.log(error.stack);
  }

}

exports.dbConnectionTest = dbConnectionTest;
exports.openDBConnection = openDBConnection;
exports.closeDBConnection = closeDBConnection;