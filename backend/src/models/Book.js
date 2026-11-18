const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a book title'],
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: [true, 'Please provide an author'],
      trim: true,
      index: true,
    },
    isbn: {
      type: String,
      required: [true, 'Please provide an ISBN'],
      unique: true,
      trim: true,
    },
    publisher: {
      type: String,
      default: '',
      trim: true,
    },
    edition: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      trim: true,
      index: true,
    },
    publicationYear: {
      type: Number,
    },
    shelfLocation: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      min: [0, 'Total copies cannot be negative'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative'],
      default: 1,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for catalog search
bookSchema.index({
  title: 'text',
  author: 'text',
  isbn: 'text',
  category: 'text',
  publisher: 'text',
  description: 'text',
});

const Book = mongoose.models.Book || mongoose.model('Book', bookSchema);

module.exports = Book;
