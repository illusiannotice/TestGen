# Usage Examples

## Basic Setup with Vue 3

### main.js

```typescript
import { createApp } from 'vue'
import { TestGenSpy } from '@testgen/ai'
import App from './App.vue'

// Load spy before app initialization
const spy = new TestGenSpy({
  maxLogSize: 2000,
  captureNetwork: true
})

// Make globally available
window.__testGenSpy = spy

const app = createApp(App)

// Add Vue mixin for component tracking
app.mixin(spy.getVueMixin())

app.mount('#app')
```

## Wrapping Utility Functions

### utils/validation.ts

```typescript
import { TestGenSpy } from '@testgen/ai'

const spy = (window as any).__testGenSpy as TestGenSpy

// Original function
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(password: string): boolean {
  return password.length >= 8
}

// Export wrapped versions
export const wrappedValidateEmail = spy.wrapFunction(
  validateEmail,
  'validateEmail'
)

export const wrappedValidatePassword = spy.wrapFunction(
  validatePassword,
  'validatePassword'
)
```

### LoginForm.vue

```vue
<template>
  <form @submit.prevent="handleLogin">
    <input
      v-model="email"
      type="email"
      placeholder="Email"
    />
    <input
      v-model="password"
      type="password"
      placeholder="Password"
    />
    <button type="submit">Login</button>
    <button type="button" @click="generateTests">
      🤖 Generate Tests
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TestGenClient } from '@testgen/ai'
import { wrappedValidateEmail, wrappedValidatePassword } from '@/utils/validation'

const email = ref('')
const password = ref('')
const spy = (window as any).__testGenSpy

const client = new TestGenClient('http://localhost:8000')

async function handleLogin() {
  // These calls are automatically logged
  if (!wrappedValidateEmail(email.value)) {
    alert('Invalid email')
    return
  }

  if (!wrappedValidatePassword(password.value)) {
    alert('Password too short')
    return
  }

  // Make API call (network request is logged)
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  })

  const data = await response.json()
  console.log('Login successful:', data)
}

async function generateTests() {
  try {
    // Get all logs for validateEmail
    const logs = spy.getLogsForFunction('validateEmail')

    if (logs.length === 0) {
      alert('No logs collected. Interact with the form first!')
      return
    }

    console.log(`📤 Generating tests for ${logs.length} interactions...`)

    // Send to backend
    const template = await client.generateTemplate(logs, 'validateEmail')
    console.log('✅ Template generated:', template.template)

    // Generate actual tests
    const result = await client.generateTests()
    console.log('✅ Tests generated at:', result.path)

    alert(`Tests generated! Check console and ${result.path}`)
  } catch (error) {
    console.error('❌ Error generating tests:', error)
    alert('Failed to generate tests. Check console.')
  }
}
</script>
```

## Tracking Pinia Store

### stores/user.ts

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TestGenSpy } from '@testgen/ai'

const spy = (window as any).__testGenSpy as TestGenSpy

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  async function loginUser(credentials: {
    email: string
    password: string
  }) {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()
      user.value = data.user
      return data
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    user.value = null
    error.value = null
  }

  return {
    user,
    isLoading,
    error,
    loginUser,
    logout
  }
})
```

### App.vue

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { TestGenSpy } from '@testgen/ai'

const userStore = useUserStore()
const spy = (window as any).__testGenSpy as TestGenSpy

onMounted(() => {
  // Track all store actions and mutations
  spy.wrapStore(userStore)
})
</script>

<template>
  <div>
    <h1>User Store Test Generation</h1>
    <button @click="testStoreTracking">Test Store Tracking</button>
  </div>
</template>
```

## Advanced: Custom Spy Configuration

```typescript
import { TestGenSpy } from '@testgen/ai'

const spy = new TestGenSpy({
  // Limit number of logs to store
  maxLogSize: 5000,

  // Enable/disable features
  captureNetwork: true,
  captureStorage: true,

  // Filter sensitive data
  filterPatterns: [
    /password/i,
    /token/i,
    /api[_-]key/i,
    /secret/i
  ]
})

// Wrap with custom names
const apiCall = spy.wrapFunction(
  async () => {
    const res = await fetch('/api/data')
    return res.json()
  },
  'fetchUserData'
)

// Get specific logs
const functionLogs = spy.getLogsForFunction('fetchUserData')
const networkLogs = spy.getLogs().filter(log => log.type === 'NETWORK_SUCCESS')
const errorLogs = spy.getLogs().filter(log => log.type === 'FUNCTION_ERROR')

console.log('Function calls:', functionLogs.length)
console.log('Network requests:', networkLogs.length)
console.log('Errors:', errorLogs.length)

// Export for analysis
const allLogs = spy.exportLogs()
const logsJson = JSON.parse(allLogs)
console.table(logsJson)
```

## Batch Export & Analysis

```typescript
import { TestGenSpy, TestGenClient } from '@testgen/ai'

const spy = (window as any).__testGenSpy as TestGenSpy
const client = new TestGenClient()

// Simulate user interactions
async function runUserScenario() {
  // User does several things...
  // ... calls functions, makes requests, etc
}

async function analyzeAndGenerateTests() {
  // Wait for interactions to complete
  await runUserScenario()

  // Get all logs
  const allLogs = spy.getLogs()

  // Analyze different function calls
  const functions = new Set(allLogs.map(log => log.name).filter(Boolean))

  console.log('Functions called:', [...functions])

  // Generate tests for each function
  for (const funcName of functions) {
    try {
      console.log(`📝 Generating tests for ${funcName}...`)

      const funcLogs = spy.getLogsForFunction(funcName)
      const template = await client.generateTemplate(funcLogs, funcName)

      console.log(`✅ ${funcName}: Template generated`)
    } catch (error) {
      console.error(`❌ ${funcName}: ${error}`)
    }
  }

  // Generate all tests at once
  const result = await client.generateTests()
  console.log('All tests generated at:', result.path)
}
```

## Real-World Complex Example

```typescript
// Full test generation workflow

import { TestGenSpy, TestGenClient } from '@testgen/ai'
import { useUserStore } from '@/stores/user'
import { useAuthService } from '@/services/auth'

class TestGenWorkflow {
  private spy: TestGenSpy
  private client: TestGenClient
  private userStore: ReturnType<typeof useUserStore>
  private authService: ReturnType<typeof useAuthService>

  constructor() {
    this.spy = (window as any).__testGenSpy
    this.client = new TestGenClient()
    this.userStore = useUserStore()
    this.authService = useAuthService()

    this.setupTracking()
  }

  private setupTracking() {
    // Track store
    this.spy.wrapStore(this.userStore)

    // Wrap key functions
    this.authService.validateToken = this.spy.wrapFunction(
      this.authService.validateToken,
      'validateToken'
    )

    this.authService.refreshToken = this.spy.wrapFunction(
      this.authService.refreshToken,
      'refreshToken'
    )
  }

  async recordUserFlow(flowName: string, fn: () => Promise<void>) {
    console.log(`🎬 Recording flow: ${flowName}`)
    this.spy.clearLogs()

    try {
      await fn()
      console.log('✅ Flow recorded')
    } catch (error) {
      console.error('❌ Flow failed:', error)
    }
  }

  async generateTestsForFlow(flowName: string, targetFunction: string) {
    const logs = this.spy.getLogs()
    console.log(`Generated ${logs.length} logs`)

    try {
      const template = await this.client.generateTemplate(logs, targetFunction)
      const tests = await this.client.generateTests()

      console.log(`✅ Tests generated for ${targetFunction}`)
      return tests
    } catch (error) {
      console.error('❌ Test generation failed:', error)
      throw error
    }
  }
}

// Usage
const workflow = new TestGenWorkflow()

// Record a user flow
await workflow.recordUserFlow('login flow', async () => {
  await useUserStore().loginUser({
    email: 'test@example.com',
    password: 'password123'
  })
})

// Generate tests
const result = await workflow.generateTestsForFlow('login flow', 'loginUser')
```

## Debugging

```typescript
import { TestGenSpy } from '@testgen/ai'

const spy = (window as any).__testGenSpy as TestGenSpy

// View all logs
console.log('All logs:', spy.getLogs())

// Filter by function
console.log('validateEmail logs:', spy.getLogsForFunction('validateEmail'))

// View in table (Chrome DevTools)
console.table(spy.getLogs())

// Export and download
const logs = spy.exportLogs()
const blob = new Blob([logs], { type: 'application/json' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `testgen-logs-${Date.now()}.json`
a.click()

// Get statistics
const allLogs = spy.getLogs()
const stats = {
  total: allLogs.length,
  functions: new Set(allLogs.filter(l => l.type === 'FUNCTION_CALL').map(l => l.name)).size,
  network: allLogs.filter(l => l.type === 'NETWORK_SUCCESS').length,
  errors: allLogs.filter(l => l.type.includes('ERROR')).length
}
console.log('Statistics:', stats)
```

---

For more examples, check the [GitHub repository](https://github.com/yourusername/testgen/examples)
