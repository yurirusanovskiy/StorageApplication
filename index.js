const readline = require('readline');
require('dotenv').config();
const { connectDB, disconnectDB } = require('./utils/db');
const { createItem, getItems, updateItem, updateInventory, deleteItem } = require('./controllers/itemController');
const User = require('./models/user');
const Tool = require('./models/tool');
const Material = require('./models/material');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function showMenu() {
  console.log(`
    Storage Management System
    1. Create Tool
    2. Create Material
    3. Create User
    4. View All Tools
    5. View All Materials
    6. Update Item
    7. Delete Item
    8. Use Tool
    9. Fix Tool
    10. View Used Tools
    11. Build Something
    12. Add to tool or material amount
    13. Exit
  `);
}

async function handleError(action) {
  try {
    await action();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await promptUser();
  }
}

async function handleMenuSelection(option) {
  switch (option) {
    case '1': // Create Tool
      rl.question('Enter tool name, amount, cost, usage, condition, and borrowedBy (comma-separated, optional): ', async (input) => {
        await handleError(async () => {
          const [name, amount, cost, usage, condition, borrowedBy = ''] = input.split(', ');
          const borrowedByArray = borrowedBy.split(',').map(id => id.trim()).filter(id => id);
          await createItem('Tool', { 
            name, 
            amount: parseInt(amount), 
            cost: parseFloat(cost), 
            usage, 
            borrowedBy: borrowedByArray, 
            condition: parseInt(condition) 
          });
          console.log(`Tool ${name} created successfully.`);
        });
      });
      break;

    case '2': // Create Material
      rl.question('Enter material name, amount, cost, supplier, and quality: ', async (input) => {
        await handleError(async () => {
          const [name, amount, cost, supplier, quality] = input.split(', ');
          await createItem('Material', { name, amount: parseInt(amount), cost: parseFloat(cost), supplier, quality });
          console.log(`Material ${name} created successfully.`);
        });
      });
      break;

    case '3': // Create User
      rl.question('Enter user name and age (separated by comma): ', async (input) => {
        await handleError(async () => {
          const [name, age] = input.split(', ');
          const user = new User({ name, age: parseInt(age) });
          await user.save();
          console.log(`User ${name} created successfully.`);
        });
      });
      break;

    case '4': // View All Tools
      await handleError(async () => {
        const tools = await getItems('Tool');
        console.log('All Tools:', tools);
      });
      break;

    case '5': // View All Materials
      await handleError(async () => {
        const materials = await getItems('Material');
        console.log('All Materials:', materials);
      });
      break;

    case '6': // Update Item
      rl.question('Enter item ID and fields to update (e.g., id, name=value, amount=value): ', async (input) => {
        await handleError(async () => {
          const [id, ...fields] = input.split(',').map(field => field.trim());
          if (!id) {
            console.log('Error: Item ID is required.');
            return;
          }
          const updateFields = {};
          fields.forEach(field => {
            const [key, value] = field.split('=').map(part => part.trim());
            if (key && value) {
              updateFields[key] = isNaN(value) ? value : Number(value);
            }
          });
          await updateItem(id, updateFields);
          console.log('Item updated successfully.');
        });
      });
      break;

    case '7': // Delete Item
      rl.question('Enter item ID to delete: ', async (id) => {
        await handleError(async () => {
          const result = await deleteItem(id.trim());
          console.log(result);
        });
      });
      break;

    case '8': // Use Tool
      rl.question('Enter user ID and tool ID to use (separated by space): ', async (input) => {
        await handleError(async () => {
          const [userId, toolId] = input.split(' ');
          const user = await User.findById(userId).exec();
          if (!user) {
            console.log('User not found.');
            return;
          }
          const result = await user.useItem(toolId);
          console.log(result);
        });
      });
      break;

    case '9': // Fix Tool
      rl.question('Enter tool ID to fix: ', async (toolId) => {
        await handleError(async () => {
          const tool = await Tool.findById(toolId).exec();
          if (!tool) {
            console.log('Tool not found.');
            return;
          }
          const result = tool.fixTool();
          console.log(result);
        });
      });
      break;

    case '10': // View Used Tools
      rl.question('Enter username to view used tools: ', async (username) => {
        await handleError(async () => {
          const user = await User.findOne({ name: username }).populate('usedTools').exec();
          if (!user) {
            console.log('User not found.');
            return;
          }
          const toolNames = await user.usedItems();
          console.log(`Tools used by ${username}: ${toolNames.join(', ')}`);
        });
      });
      break;

    case '11': // Build Something
    rl.question('Enter user ID, tools and materials with amounts (e.g., user_id, Hammer:1, Screwdriver:2, Metal:100, Wood:20): ', async (input) => {
      await handleError(async () => {
        const parts = input.split(',').map(part => part.trim());
        const userId = parts[0];
        const tools = [];
        const materials = [];
    
        // We receive all available tools and materials from the database
        const allTools = await getItems('Tool');
        const allMaterials = await getItems('Material');
    
        // Processing user input
        for (let i = 1; i < parts.length; i++) {
          const item = parts[i];
          const [name, amount] = item.split(':').map(part => part.trim());
    
          if (amount) {
            const tool = allTools.find(tool => tool.name.toLowerCase() === name.toLowerCase());
            const material = allMaterials.find(material => material.name.toLowerCase() === name.toLowerCase());
    
            if (tool) {
              tools.push({ name: tool.name, quantity: parseInt(amount) });
            } else if (material) {
              materials.push({ name: material.name, quantity: parseInt(amount) });
            } else {
              console.log(`Item with name "${name}" not found in tools or materials.`);
            }
          }
        }
    
        // Get user by userId
        const user = await User.findById(userId).exec();
        if (!user) {
          console.log('User not found.');
        } else {
          // We check the availability and quantity of tools and materials
          const result = await user.buildSomething({ tools, materials, allTools, allMaterials });
          // We check the result and update the database
          if (result === 'Successfully built something using tools and materials!') {
            await updateInventory(tools, materials); // We are updating the number of materials and tools
            console.log(result);
          } else {
            console.log(result); // Display an error message
          }
        }
      });
    });
    break;
    
    case '12': // Add to tool or material amount
    rl.question('Enter item type (Tool or Material), name, and amount to add (e.g., Tool, Hammer, 5): ', async (input) => {
      await handleError(async () => {
        const parts = input.split(',').map(part => part.trim());
        const itemType = parts[0]; // Tool or Material
        const itemName = parts[1]; // Name of the tool or material
        const additionalAmount = parseInt(parts[2], 10); // Amount to add
        
        if (isNaN(additionalAmount) || additionalAmount <= 0) {
          console.log('Invalid amount. Please provide a positive number.');
          return;
        }

        // We get the correct model depending on the element type
        const Model = itemType === 'Tool' ? Tool : itemType === 'Material' ? Material : null;

        if (!Model) {
          console.log('Invalid item type. Please enter "Tool" or "Material".');
          return;
        }

        // Search for a tool or material by name, case sensitive
        const foundItem = await Model.findOne({ name: { $regex: new RegExp(`^${itemName}$`, 'i') } }).exec();

        if (!foundItem) {
          console.log(`${itemType} with name "${itemName}" not found.`);
          return;
        }

        // Add quantity using newArrival method
        const newAmount = foundItem.newArrival(additionalAmount);
        await foundItem.save();

        console.log(`Updated ${itemType}: ${itemName}, new amount: ${newAmount}`);
      });
    });
    break;


    case '13': // Exit
      await disconnectDB();
      rl.close();
      console.log('Exiting the application...');
      process.exit(0);
      break;

    default:
      console.log('Invalid option. Please select a number between 1 and 13.');
      await promptUser();
      break;
  }
}

async function promptUser() {
  showMenu();
  rl.question('Select an option: ', handleMenuSelection);
}

async function startApp() {
  await connectDB();
  await promptUser();
}

startApp();
