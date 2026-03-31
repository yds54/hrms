const mongoose = require('mongoose');

const CriteriaSchema = new mongoose.Schema({
  criteria: {
    type: String,
    required: true,
    trim: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
   isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('criteria', CriteriaSchema);