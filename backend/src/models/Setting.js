const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'library_config',
    },
    maxBorrowLimit: {
      type: Number,
      default: 3,
      min: [1, 'Maximum borrow limit must be at least 1'],
    },
    loanPeriodDays: {
      type: Number,
      default: 14,
      min: [1, 'Loan period must be at least 1 day'],
    },
    finePerDay: {
      type: Number,
      default: 2,
      min: [0, 'Fine per day cannot be negative'],
    },
    isFineEnabled: {
      type: Boolean,
      default: true,
    },
    maxReservationLimit: {
      type: Number,
      default: 2,
      min: [1, 'Maximum reservation limit must be at least 1'],
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingSchema);

module.exports = Setting;
