const mongoose = require('mongoose');

// Generic atomic counter used to generate sequential, human-friendly
// numbers (order numbers, invoice numbers) without race conditions.
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "invoice-2026"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

/**
 * Atomically increments and returns the next sequence number for `key`.
 */
async function nextSequence(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

module.exports = { Counter, nextSequence };
