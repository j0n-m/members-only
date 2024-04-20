const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 12,
  },
  lastName: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 12,
  },
  username: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 16,
  },
  password: {
    type: String,
    minLength: 5,
    required: true,
  },
  membershipCode: {
    type: Number,
    required: true,
    enum: [0],
    default: 0,
  },
  isAdmin: {
    type: Boolean,
    default: false,
    required: true
  }
});
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
})

module.exports = mongoose.model('User', userSchema);