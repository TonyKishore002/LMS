const mongoose = require('mongoose');

const fineSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BorrowTransaction',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Fine amount cannot be negative'],
    },
    paidStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'waived'],
      default: 'unpaid',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      default: 'Overdue return fine',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

fineSchema.index({ student: 1, paidStatus: 1 });

const Fine = mongoose.models.Fine || mongoose.model('Fine', fineSchema);

module.exports = Fine;
