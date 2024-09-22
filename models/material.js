const mongoose = require('mongoose');
const Item = require('./item');

// Material Schema
const materialSchema = new mongoose.Schema({
  supplier: { type: String, required: true },  // Material supplier
  quality: { type: String, required: true },   // Material quality (rating)
}, { discriminatorKey: 'type' });

// Method for using material (reducing quantity)
materialSchema.methods.use = function(amount) {
  if (this.quantity >= amount) {
    this.quantity -= amount; // Reduce the amount of material by a given amount
    return `Used ${amount} units of material. Remaining quantity: ${this.quantity}`;
  } else {
    return `Not enough material. Available quantity: ${this.quantity}`;
  }
};

module.exports = Item.discriminator('Material', materialSchema);
