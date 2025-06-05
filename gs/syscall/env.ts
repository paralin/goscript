import * as $ from '@goscript/builtin/index.js'

// Environment variable functions using Node.js/browser APIs
export function Getenv(key: string): [string, boolean] {
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key]
    return value !== undefined ? [value, true] : ['', false]
  }
  return ['', false]
}

export function Setenv(key: string, value: string): $.GoError {
  if (typeof process !== 'undefined' && process.env) {
    process.env[key] = value
    return null
  }
  return { Error: () => 'setenv not supported' }
}

export function Unsetenv(key: string): $.GoError {
  if (typeof process !== 'undefined' && process.env) {
    delete process.env[key]
    return null
  }
  return { Error: () => 'unsetenv not supported' }
}

export function Clearenv(): void {
  if (typeof process !== 'undefined' && process.env) {
    for (const key in process.env) {
      delete process.env[key]
    }
  }
}

export function Environ(): $.Slice<string> {
  if (typeof process !== 'undefined' && process.env) {
    const env: string[] = []
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env.push(`${key}=${value}`)
      }
    }
    return $.arrayToSlice(env)
  }
  return $.arrayToSlice([])
} 