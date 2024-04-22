const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');
const tz = require('moment-timezone');

const messageSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
  },
  content: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 70,
  },
  dateCreated: {
    type: Date,
    required: true,
  }

});
messageSchema.virtual('dateFormat').get(function () {
  return moment(this.dateCreated).tz('America/Chicago').format('lll');
})

module.exports = mongoose.model('Message', messageSchema);

