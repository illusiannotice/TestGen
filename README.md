# TestGen AI - AI-Powered Test Generation

[![npm version](https://badge.fury.io/js/%40testgen%2Fai.svg)](https://badge.fury.io/js/%40testgen%2Fai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Generate comprehensive tests automatically by analyzing your function execution logs using AI.

## 🎯 Features

- 🔍 **Automatic Function Tracking** - Track all function calls, parameters, and return values
- 📡 **Network Monitoring** - Capture all fetch/HTTP requests
- 🏪 **Store Tracking** - Monitor Pinia/Vuex store actions and mutations
- 🤖 **AI-Powered Test Generation** - Generates realistic test cases from real user interactions
- 📊 **Call Stack Analysis** - Track function call hierarchies
- ⚡ **Zero Configuration** - Works out of the box
- 🔐 **Type-Safe** - Full TypeScript support

## 📦 Installation

```bash
npm install @testgen/ai
# or
yarn add @testgen/ai
# or
pnpm add @testgen/ai
```

## 🚀 Quick Start

### 1. Initialize the Spy in Your App

```typescript
import { TestGenSpy, TestGenClient } from '@testgen/ai';

// Create spy instance
const spy = new TestGenSpy({
  maxLogSize: 1000,
  captureNetwork: true,
});

// Make it global
window.__testGenSpy = spy;

// (Optional) Add Vue mixin for component tracking
app.mixin(spy.getVueMixin());
```

### 2. Wrap Functions to Track

```typescript
import { validateEmail } from './utils/validation';

// Wrap function
const wrappedValidate = spy.wrapFunction(validateEmail, 'validateEmail');

// Use as normal
wrappedValidate('test@example.com');
```

### 3. Wrap Pinia Store

```typescript
import { useUserStore } from './stores/user';

const userStore = useUserStore();

// Track store actions
spy.wrapStore(userStore);

// Now all actions are automatically tracked
await userStore.loginUser({ email, password });
```

### 4. Generate Tests

```typescript
const client = new TestGenClient('http://localhost:8000');

// Get logs for a function
const logs = spy.getLogsForFunction('validateEmail');

// Send to backend for AI analysis
const template = await client.generateTemplate(logs, 'validateEmail');

// Generate actual test file
const testFile = await client.generateTests();

console.log(`Tests generated at: ${testFile.path}`);
```

## 📖 API Reference

### `TestGenSpy`

#### Constructor Options

```typescript
new TestGenSpy({
  maxLogSize: number;          // Default: 1000
  captureNetwork: boolean;     // Default: true
  captureStorage: boolean;     // Default: false
  filterPatterns: RegExp[];    // Default: []
})
```

#### Methods

- **`wrapFunction(fn, name)`** - Track a function
- **`wrapStore(store)`** - Track a Pinia/Vuex store
- **`getLogs()`** - Get all collected logs
- **`getLogsForFunction(name)`** - Get logs for specific function
- **`clearLogs()`** - Clear all logs
- **`exportLogs()`** - Export logs as JSON string
- **`getVueMixin()`** - Get Vue mixin for component tracking

### `TestGenClient`

#### Constructor

```typescript
new TestGenClient(baseURL?: string)  // Default: 'http://localhost:8000'
```

#### Methods

- **`generateTemplate(logs, functionName)`** - Generate test template
- **`generateTests()`** - Generate actual test code
- **`healthCheck()`** - Check API availability
- **`setBaseURL(url)`** - Update API base URL
- **`getBaseURL()`** - Get current API base URL

## 🔧 Full Example

```typescript
import { TestGenSpy, TestGenClient } from '@testgen/ai';

// Setup
const spy = new TestGenSpy();
const client = new TestGenClient('http://localhost:8000');

// Wrap your utility functions
import { validateUser } from '@/utils/validators';
const wrappedValidate = spy.wrapFunction(validateUser, 'validateUser');

// Use in your Vue components
export default {
  methods: {
    async handleLogin(user) {
      const isValid = wrappedValidate(user);
      if (!isValid) return;
      
      // ... rest of login logic
    }
  }
}

// When ready to generate tests:
async function generateTests() {
  try {
    // Collect logs
    const logs = spy.getLogsForFunction('validateUser');
    
    if (logs.length === 0) {
      console.warn('No logs collected for this function');
      return;
    }
    
    // Generate template
    const template = await client.generateTemplate(logs, 'validateUser');
    console.log('Template:', template.template);
    
    // Generate actual tests
    const result = await client.generateTests();
    console.log('Tests saved to:', result.path);
    
  } catch (error) {
    console.error('Test generation failed:', error);
  }
}
```

## 🏗️ Backend Setup

This package requires a backend server for AI test generation. See [backend documentation](./backend/README.md).

Quick start:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn rest.main:app --reload
```

## 🎨 Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any ES2020+ compatible browser

## 📄 What Gets Logged

### Function Calls
```json
{
  "type": "FUNCTION_CALL",
  "name": "validateEmail",
  "params": ["test@example.com"],
  "body": "function code snippet"
}
```

### Network Requests
```json
{
  "type": "NETWORK_START",
  "url": "https://api.example.com/users",
  "method": "POST",
  "headers": {...},
  "body": "request body"
}
```

### Store Actions
```json
{
  "type": "STORE_ACTION",
  "storeName": "user",
  "action": "loginUser",
  "params": [{email: "...", password: "..."}]
}
```

## 🔐 Privacy & Security

- **No data sent to external services** (only to your configured backend)
- **Sensitive data filtering** - Can exclude patterns via `filterPatterns`
- **Local storage** - Logs stored in memory only
- **HTTPS support** - Use HTTPS URLs for secure communication

## 🐛 Debugging

View collected logs in browser console:

```javascript
// All logs
console.log(window.__testGenSpy.getLogs());

// Filter by function
console.log(window.__testGenSpy.getLogsForFunction('validateEmail'));

// Export as file
const data = window.__testGenSpy.exportLogs();
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'testgen-logs.json';
a.click();
```

## 🚨 Troubleshooting

### No logs are being captured

**Solution:** Make sure you're using the wrapped version of functions:

```typescript
// ❌ Wrong
import { validateEmail } from './utils';
validateEmail('test@example.com');  // Not logged

// ✅ Correct
const wrapped = spy.wrapFunction(validateEmail, 'validateEmail');
wrapped('test@example.com');  // Logged
```

### Backend connection error

**Solution:** Ensure backend is running on correct port:

```typescript
const client = new TestGenClient('http://localhost:8000');

// Check connection
const isHealthy = await client.healthCheck();
console.log('Backend status:', isHealthy ? '✅ OK' : '❌ Down');
```

### TypeScript errors

**Solution:** Ensure you have TypeScript 4.5+ and `esModuleInterop` enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "esModuleInterop": true
  }
}
```

## 📄 License

MIT © 2024

## 🤝 Contributing

Contributions welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

## 💬 Support

- Email: 10sargsyanmesrop@gmail.com

---

**Made with ❤️ for developers who want better tests**
