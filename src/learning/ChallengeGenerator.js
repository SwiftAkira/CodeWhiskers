const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

class ChallengeGenerator {
    constructor() {
        this.challengeTemplates = {
            'Code Complexity': {
                beginner: [
                    {
                        title: 'Function Simplification',
                        description: 'Refactor this function to make it more readable and maintainable.',
                        template: `function processData(data) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].type === 'A') {
      if (data[i].value > 10) {
        result.push({ id: data[i].id, score: data[i].value * 2 });
      } else {
        result.push({ id: data[i].id, score: data[i].value });
      }
    } else if (data[i].type === 'B') {
      if (data[i].value > 5) {
        result.push({ id: data[i].id, score: data[i].value * 3 });
      }
    }
  }
  return result;
}`,
                        solution: `// Solution approach:
// 1. Use array methods instead of for loops
// 2. Extract condition logic to separate functions
// 3. Make the code more declarative

function processData(data) {
  return data
    .filter(item => shouldIncludeItem(item))
    .map(item => transformItem(item));
}

function shouldIncludeItem(item) {
  return item.type === 'A' || (item.type === 'B' && item.value > 5);
}

function transformItem(item) {
  const multiplier = getMultiplier(item);
  return {
    id: item.id,
    score: item.value * multiplier
  };
}

function getMultiplier(item) {
  if (item.type === 'A' && item.value > 10) return 2;
  if (item.type === 'B') return 3;
  return 1;
}`
                    },
                    {
                        title: 'Extract Helper Methods',
                        description: 'Break down this large function into smaller helper functions.',
                        template: `function calculateOrderTotal(order, user, promos) {
  // Calculate subtotal
  let subtotal = 0;
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    if (item.quantity > 0 && item.price > 0) {
      subtotal += item.quantity * item.price;
    }
  }
  
  // Apply discounts
  let discount = 0;
  if (user.membershipLevel === 'gold') {
    discount = subtotal * 0.1;
  } else if (user.membershipLevel === 'silver') {
    discount = subtotal * 0.05;
  }
  
  // Apply promotional codes
  let promoDiscount = 0;
  for (let i = 0; i < promos.length; i++) {
    if (promos[i].active && order.promoCodes.includes(promos[i].code)) {
      promoDiscount += subtotal * promos[i].discountRate;
    }
  }
  
  // Calculate tax
  const taxRate = 0.08; // 8% tax
  const taxableAmount = subtotal - discount - promoDiscount;
  const tax = taxableAmount * taxRate;
  
  // Calculate final total
  const total = taxableAmount + tax;
  
  return {
    subtotal: subtotal,
    discount: discount,
    promoDiscount: promoDiscount,
    tax: tax,
    total: total
  };
}`,
                        solution: `// Solution approach:
// 1. Extract each logical section into its own function
// 2. Make the main function a composition of smaller functions
// 3. Use reduce for calculations where appropriate

function calculateOrderTotal(order, user, promos) {
  const subtotal = calculateSubtotal(order.items);
  const discount = calculateMembershipDiscount(subtotal, user);
  const promoDiscount = calculatePromoDiscounts(subtotal, order.promoCodes, promos);
  const taxableAmount = subtotal - discount - promoDiscount;
  const tax = calculateTax(taxableAmount);
  const total = taxableAmount + tax;
  
  return {
    subtotal,
    discount,
    promoDiscount,
    tax,
    total
  };
}

function calculateSubtotal(items) {
  return items.reduce((total, item) => {
    if (item.quantity > 0 && item.price > 0) {
      return total + (item.quantity * item.price);
    }
    return total;
  }, 0);
}

function calculateMembershipDiscount(subtotal, user) {
  const discountRates = {
    'gold': 0.1,
    'silver': 0.05,
    'default': 0
  };
  
  const rate = discountRates[user.membershipLevel] || discountRates.default;
  return subtotal * rate;
}

function calculatePromoDiscounts(subtotal, appliedPromoCodes, availablePromos) {
  return availablePromos.reduce((total, promo) => {
    if (promo.active && appliedPromoCodes.includes(promo.code)) {
      return total + (subtotal * promo.discountRate);
    }
    return total;
  }, 0);
}

function calculateTax(amount) {
  const taxRate = 0.08; // 8% tax
  return amount * taxRate;
}`
                    }
                ],
                intermediate: [
                    {
                        title: 'Apply Single Responsibility Principle',
                        description: 'Refactor this class to follow the Single Responsibility Principle.',
                        template: `class UserManager {
  constructor(database) {
    this.database = database;
  }
  
  async createUser(userData) {
    // Validate user data
    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Invalid email');
    }
    if (!userData.password || userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    // Hash password
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Store in database
    const user = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    const result = await this.database.users.insert(user);
    
    // Send welcome email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      // email config
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'system@example.com',
        pass: 'password123'
      }
    });
    
    await transporter.sendMail({
      from: 'welcome@example.com',
      to: user.email,
      subject: 'Welcome to our platform',
      text: 'Welcome! Thank you for signing up.'
    });
    
    // Log activity
    console.log(\`User created: \${user.email}\`);
    await this.database.logs.insert({
      action: 'user_created',
      userId: result.id,
      timestamp: new Date()
    });
    
    return result;
  }
  
  // Other user-related methods...
}`,
                        solution: `// Solution approach:
// 1. Split into smaller classes with single responsibilities
// 2. Use dependency injection for services
// 3. Create interfaces between components

// User validation service
class UserValidator {
  validateUser(userData) {
    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Invalid email');
    }
    if (!userData.password || userData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  }
}

// Password service
class PasswordService {
  async hashPassword(password) {
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}

// Email service
class EmailService {
  constructor(config) {
    this.config = config;
  }
  
  async sendWelcomeEmail(email) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport(this.config);
    
    await transporter.sendMail({
      from: 'welcome@example.com',
      to: email,
      subject: 'Welcome to our platform',
      text: 'Welcome! Thank you for signing up.'
    });
  }
}

// Activity logger
class ActivityLogger {
  constructor(database) {
    this.database = database;
  }
  
  async logUserCreated(userId) {
    console.log(\`User created: \${userId}\`);
    await this.database.logs.insert({
      action: 'user_created',
      userId,
      timestamp: new Date()
    });
  }
}

// Main user manager
class UserManager {
  constructor(database, validator, passwordService, emailService, activityLogger) {
    this.database = database;
    this.validator = validator;
    this.passwordService = passwordService;
    this.emailService = emailService;
    this.activityLogger = activityLogger;
  }
  
  async createUser(userData) {
    // Validate user
    this.validator.validateUser(userData);
    
    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(userData.password);
    
    // Store in database
    const user = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date()
    };
    
    const result = await this.database.users.insert(user);
    
    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email);
    
    // Log activity
    await this.activityLogger.logUserCreated(result.id);
    
    return result;
  }
  
  // Other user-related methods...
}`
                    }
                ]
            },
            'Debugging Practices': {
                beginner: [
                    {
                        title: 'Debugging with Breakpoints',
                        description: 'Rather than using console.log, learn to debug this function with breakpoints.',
                        template: `// This function has a bug. Instead of using console.log to find it,
// use VS Code's debugger with breakpoints to identify the issue.
function findLargestNumbers(arrays) {
  const result = [];
  for (let i = 0; i < arrays.length; i++) {
    let largest = arrays[i][0];
    
    console.log('Array:', arrays[i]);
    console.log('Starting largest:', largest);
    
    for (let j = 0; j < arrays[i].length; j++) {
      console.log('Comparing', largest, 'with', arrays[i][j]);
      
      if (arrays[i][j] > largest) {
        largest = arrays[i][j];
        console.log('New largest:', largest);
      }
    }
    
    result.push(largest);
    console.log('Final largest for array', i, ':', largest);
  }
  
  console.log('Result:', result);
  return result;
}

// Example usage:
const testArrays = [
  [1, 5, 3, 9, 2],
  [10, 15, 13, 12],
  [101, 55, 99]
];
const result = findLargestNumbers(testArrays);
// Expected: [9, 15, 101]
// Actual output might be different due to the bug`,
                        solution: `// The bug is in the inner loop - we start comparing from index 0 again,
// which we've already assigned to 'largest'. We should start from index 1.

function findLargestNumbers(arrays) {
  const result = [];
  for (let i = 0; i < arrays.length; i++) {
    let largest = arrays[i][0];
    
    // Start from index 1 since we already assigned arrays[i][0] to largest
    for (let j = 1; j < arrays[i].length; j++) {
      if (arrays[i][j] > largest) {
        largest = arrays[i][j];
      }
    }
    
    result.push(largest);
  }
  
  return result;
}

// Example usage:
const testArrays = [
  [1, 5, 3, 9, 2],
  [10, 15, 13, 12],
  [101, 55, 99]
];
const result = findLargestNumbers(testArrays);
// Correct output: [9, 15, 101]`
                    }
                ]
            },
            'Modern Language Features': {
                beginner: [
                    {
                        title: 'Convert to Template Literals',
                        description: 'Refactor this code to use template literals instead of string concatenation.',
                        template: `function generateUserSummary(user) {
  return 'User: ' + user.name + ' (ID: ' + user.id + ')\\n' +
         'Email: ' + user.email + '\\n' +
         'Joined: ' + user.joinDate + '\\n' +
         'Plan: ' + user.plan.name + ' ($' + user.plan.price + '/month)\\n' +
         'Features: ' + user.plan.features.join(', ') + '\\n' +
         'Usage: ' + Math.round(user.usage.percentage) + '% of ' + user.usage.limit + ' ' + user.usage.unit;
}`,
                        solution: `// Solution using template literals
function generateUserSummary(user) {
  return \`User: \${user.name} (ID: \${user.id})
Email: \${user.email}
Joined: \${user.joinDate}
Plan: \${user.plan.name} (\$\${user.plan.price}/month)
Features: \${user.plan.features.join(', ')}
Usage: \${Math.round(user.usage.percentage)}% of \${user.usage.limit} \${user.usage.unit}\`;
}`
                    },
                    {
                        title: 'Apply Array Methods',
                        description: 'Refactor this code to use modern array methods like map, filter, and reduce.',
                        template: `function processOrders(orders) {
  // 1. Filter out incomplete orders
  const validOrders = [];
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].status === 'complete') {
      validOrders.push(orders[i]);
    }
  }
  
  // 2. Extract and format order information
  const processedOrders = [];
  for (let i = 0; i < validOrders.length; i++) {
    const order = validOrders[i];
    processedOrders.push({
      id: order.id,
      customer: order.customerName,
      date: new Date(order.timestamp).toLocaleDateString(),
      amount: '$' + order.total.toFixed(2)
    });
  }
  
  // 3. Sort by order date (newest first)
  processedOrders.sort(function(a, b) {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB - dateA;
  });
  
  // 4. Calculate total revenue
  let totalRevenue = 0;
  for (let i = 0; i < validOrders.length; i++) {
    totalRevenue += validOrders[i].total;
  }
  
  return {
    orders: processedOrders,
    total: '$' + totalRevenue.toFixed(2),
    count: processedOrders.length
  };
}`,
                        solution: `// Solution using modern array methods
function processOrders(orders) {
  // 1. Filter out incomplete orders
  const validOrders = orders.filter(order => order.status === 'complete');
  
  // 2. Extract and format order information using map
  const processedOrders = validOrders.map(order => ({
    id: order.id,
    customer: order.customerName,
    date: new Date(order.timestamp).toLocaleDateString(),
    amount: \`$\${order.total.toFixed(2)}\`
  }));
  
  // 3. Sort by order date (newest first)
  processedOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 4. Calculate total revenue using reduce
  const totalRevenue = validOrders.reduce((sum, order) => sum + order.total, 0);
  
  return {
    orders: processedOrders,
    total: \`$\${totalRevenue.toFixed(2)}\`,
    count: processedOrders.length
  };
}`
                    }
                ]
            }
        };
    }
    
    generateChallenge(learningPath) {
        if (!learningPath || learningPath.length === 0) {
            return null;
        }
        
        // Select a challenge from the learning path
        const pathItem = learningPath[0]; // Take the first item in the learning path
        
        // Find matching challenge template
        const areaTemplates = this.challengeTemplates[pathItem.area];
        if (!areaTemplates) {
            return this.generateGenericChallenge(pathItem);
        }
        
        const difficultyTemplates = areaTemplates[pathItem.difficulty];
        if (!difficultyTemplates || difficultyTemplates.length === 0) {
            return this.generateGenericChallenge(pathItem);
        }
        
        // Select a random template from the available ones
        const templateIndex = Math.floor(Math.random() * difficultyTemplates.length);
        const template = difficultyTemplates[templateIndex];
        
        return {
            id: `${pathItem.area.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            title: template.title,
            description: template.description,
            area: pathItem.area,
            difficulty: pathItem.difficulty,
            code: template.template,
            solution: template.solution,
            catCharacter: pathItem.catCharacter
        };
    }
    
    generateGenericChallenge(pathItem) {
        // Fallback generic challenge when no template is available
        return {
            id: `generic-${Date.now()}`,
            title: `${pathItem.challenge}`,
            description: `Practice ${pathItem.challenge} to improve your ${pathItem.area} skills.`,
            area: pathItem.area,
            difficulty: pathItem.difficulty,
            code: `// This is a practice area for: ${pathItem.challenge}\n\n// Write your code here`,
            solution: `// Sample approach to ${pathItem.challenge}:\n\n// 1. Start with the basic structure\n// 2. Apply best practices for ${pathItem.area}\n// 3. Refine your solution`,
            catCharacter: pathItem.catCharacter
        };
    }
    
    async saveChallenge(challenge, targetDir = '') {
        // Create a directory for challenges if it doesn't exist
        const storagePath = path.join(targetDir || this.getStoragePath(), 'whiskercode-challenges');
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        
        // Save the challenge to a file
        const filename = `${challenge.id}.json`;
        const filePath = path.join(storagePath, filename);
        
        await fs.promises.writeFile(
            filePath,
            JSON.stringify(challenge, null, 2)
        );
        
        return filePath;
    }
    
    getStoragePath() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (workspaceFolder) {
            return workspaceFolder.uri.fsPath;
        }
        
        // Fallback to extension storage path
        return path.join(process.env.HOME || process.env.USERPROFILE, '.whiskercode');
    }
    
    async loadChallenge(challengeId, targetDir = '') {
        const storagePath = path.join(targetDir || this.getStoragePath(), 'whiskercode-challenges');
        const filePath = path.join(storagePath, `${challengeId}.json`);
        
        if (!fs.existsSync(filePath)) {
            return null;
        }
        
        const content = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(content);
    }
    
    async listChallenges(targetDir = '') {
        const storagePath = path.join(targetDir || this.getStoragePath(), 'whiskercode-challenges');
        
        if (!fs.existsSync(storagePath)) {
            return [];
        }
        
        const files = await fs.promises.readdir(storagePath);
        
        const challenges = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(storagePath, file);
                const content = await fs.promises.readFile(filePath, 'utf8');
                challenges.push(JSON.parse(content));
            }
        }
        
        return challenges;
    }
}

module.exports = ChallengeGenerator; 