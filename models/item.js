const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 0 },
}, { discriminatorKey: 'type' });

// Method for calculating the total cost
itemSchema.methods.worth = function() {
  return this.amount * this.cost;
};

// Method for adding new receipt
itemSchema.methods.newArrival = function(additionalAmount) {
  this.amount += additionalAmount;
  return this.amount;
};

module.exports = mongoose.model('Item', itemSchema);
