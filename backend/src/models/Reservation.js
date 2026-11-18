const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['pending', 'available', 'fulfilled', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    reservationDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    priorityNumber: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reservationSchema.index({ student: 1, status: 1 });
reservationSchema.index({ book: 1, status: 1 });

const Reservation =
  mongoose.models.Reservation ||
  mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
