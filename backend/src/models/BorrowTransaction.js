const mongoose = require('mongoose');

const borrowTransactionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['requested', 'issued', 'returned', 'rejected', 'overdue'],
      default: 'requested',
      index: true,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    issueDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: [0, 'Fine amount cannot be negative'],
    },
    isFinePaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

borrowTransactionSchema.index({ student: 1, status: 1 });
borrowTransactionSchema.index({ book: 1, status: 1 });

const BorrowTransaction =
  mongoose.models.BorrowTransaction ||
  mongoose.model('BorrowTransaction', borrowTransactionSchema);

module.exports = BorrowTransaction;
