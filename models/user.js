const mongoose = require('mongoose');
const { Schema } = mongoose;
const Tool = require('./tool');
const Material = require('./material');

const userSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  usedTools: [{ type: Schema.Types.ObjectId, ref: 'Tool' }] // List of tools used by the user
});

// Method for using an object (tool)
userSchema.methods.useItem = async function(toolId) {
  const tool = await Tool.findById(toolId); // Find a tool by ID
  if (!tool) {
    return 'Tool not found';
  }

  // Pass the user ID to the useTool method
  const result = tool.useTool(this._id); 

  if (result.startsWith('Tool cannot be used')) {
    return result; // The tool cannot be used.
  }

  tool.borrowedBy.push(this._id); // Add the user's ObjectId to the list of those who used the tool
  await tool.save(); // Save changes

  this.usedTools.push(tool._id); // Adding a tool to the list of those used by the user
  await this.save(); // Save the updated user

  return result;
};

// Method to get all used tools
userSchema.methods.usedItems = async function() {
  const tools = await Tool.find({ _id: { $in: this.usedTools } }).select('name').exec();
  return tools.map(tool => tool.name); // Return only the names of the instruments
};

// A method for assembling (building something)
userSchema.methods.buildSomething = async function({ tools, materials, allTools, allMaterials }) {
  // Checking the tools
  for (const tool of tools) {
    const foundTool = allTools.find(t => t.name.toLowerCase() === tool.name.toLowerCase());
    if (!foundTool || foundTool.quantity < tool.quantity) {
      return `Not enough ${tool.name} to build something.`;
    }
  }

  // Checking materials
  for (const material of materials) {
    const foundMaterial = allMaterials.find(m => m.name.toLowerCase() === material.name.toLowerCase());
    if (!foundMaterial || foundMaterial.quantity < material.quantity) {
      return `Not enough ${material.name} to build something.`;
    }
  }

  return 'Successfully built something using tools and materials!';
};

module.exports = mongoose.model('User', userSchema);
