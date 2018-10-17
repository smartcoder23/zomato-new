var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  // UserSchema.statics.findOrCreate = require("find-or-create");
  updated_at: { type: Date, default: Date.now },
});

 UserSchema.statics.findOrCreate = require("find-or-create");

module.exports = mongoose.model('auth', UserSchema);
