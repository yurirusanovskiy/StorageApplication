const mongoose = require('mongoose');
const Item = require('./item');

// Tool Schema
const toolSchema = new mongoose.Schema({
  usage: { type: String, required: true }, // Field of use
  borrowedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of users who took the tool
  condition: { type: Number, required: true, min: 0, max: 100 }, // Instrument condition from 1 to 100
}, { discriminatorKey: 'type' });

// Method to use Tool
toolSchema.methods.useTool = function(userId) {
  if (this.condition > 15) {
    this.condition -= 10; // Reduce the condition by 10
    this.borrowedBy.push(userId); // Add the user who took the tool

    // Convert ObjectId to string for output
    return `Tool used by user with ID: ${userId.toString()}. Current condition: ${this.condition}`;
  } else {
    return `Tool cannot be used. Condition is too low (${this.condition}).`;
  }
};

// Method for repairing the tool
toolSchema.methods.fixTool = function() {
  this.condition = Math.min(this.condition + 20, 100); // Add 20 to the condition, but not more than 100
  this.save();
  return `Tool fixed. Current condition: ${this.condition}`;
};

module.exports = Item.discriminator('Tool', toolSchema);
