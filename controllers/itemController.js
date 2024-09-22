const Item = require('../models/item');
const Tool = require('../models/tool');
const Material = require('../models/material');
const User = require('../models/user');

async function createItem(type, data) {
  try {
    let item;
    if (type === 'Tool') {
      const { borrowedBy = [], ...restData } = data;
      const borrowedByObjectIds = await Promise.all(
        borrowedBy.map(async (username) => {
          const user = await User.findOne({ name: username });
          return user ? user._id : null;
        })
      );

      item = new Tool({ ...restData, borrowedBy: borrowedByObjectIds.filter(id => id) });
    } else if (type === 'Material') {
      item = new Material(data);
    } else {
      throw new Error('Invalid item type.');
    }

    await item.save();
    console.log(`${type} created successfully.`);
  } catch (error) {
    console.error('Error creating item:', error.message);
  }
}

async function getItems(type) {
  try {
    const Model = type === 'Tool' ? Tool : type === 'Material' ? Material : null;
    if (!Model) throw new Error('Invalid item type.');

    const populateFields = type === 'Tool' ? ['borrowedBy'] : [];
    const items = await Model.find().populate(populateFields).exec();
    console.log(`All ${type}s:`, items);
    return items;  // Returning elements
  } catch (error) {
    console.error('Error retrieving items:', error.message);
    return [];  // Return an empty array in case of an error
  }
}

async function updateItem(id, updateFields) {
  try {
    const item = await Item.findById(id);
    if (!item) throw new Error('Item not found');

    Object.assign(item, updateFields);
    await item.save();
    console.log('Item updated successfully.');
  } catch (error) {
    console.error('Error updating item:', error.message);
  }
}

async function deleteItem(id) {
  try {
    const result = await Item.findByIdAndDelete(id);
    if (!result) throw new Error('Item not found');
    console.log('Item deleted successfully.');
  } catch (error) {
    console.error('Error deleting item:', error.message);
  }
}

async function findUserByUsername(name) {
  try {
    return await User.findOne({ name }) || null;
  } catch (error) {
    console.error('Error finding user:', error.message);
    return null;
  }
}

async function updateInventory(tools, materials) {
  try {
    console.log('Updating inventory with:', tools, materials);
    
    // Updating materials
    for (const material of materials) {
      const foundMaterial = await Material.findOne({ name: material.name }).exec();
      if (foundMaterial) {
        console.log(`Current amount of ${foundMaterial.name}:`, foundMaterial.amount);
        const newAmount = foundMaterial.amount - material.quantity;
        if (newAmount >= 0) {
          foundMaterial.amount = newAmount;
          await foundMaterial.save();
          console.log(`Updated material: ${foundMaterial.name}, new amount: ${foundMaterial.amount}`);
        } else {
          console.log(`Not enough ${foundMaterial.name} in inventory.`);
        }
      }
    }
    
    console.log('Inventory updated successfully.');
  } catch (error) {
    console.error('Error updating inventory:', error.message);
  }
}

module.exports = {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  updateInventory,
  findUserByUsername
};
