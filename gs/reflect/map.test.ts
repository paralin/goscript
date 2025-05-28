import { describe, it, expect } from 'vitest'
import { MapOf } from './type.js'
import { MapIter } from './map.js'

describe('MapIter', () => {
  it('should iterate over map entries with proper typing', () => {
    const map = new Map<string, number>()
    map.set('one', 1)
    map.set('two', 2)
    map.set('three', 3)
    
    const iter = new MapIter<string, number>(map)
    
    expect(iter.current?.done === false).toBe(true)
    expect(iter.Key()).toBe('one')
    expect(iter.Value()).toBe(1)
    
    expect(iter.Next()).toBe(true)
    expect(iter.current?.done === false).toBe(true)
    expect(typeof iter.Key()).toBe('string')
    expect(typeof iter.Value()).toBe('number')
    
    const newMap = new Map<string, number>()
    newMap.set('reset', 100)
    iter.Reset(newMap)
    
    expect(iter.current?.done === false).toBe(true)
    expect(iter.Key()).toBe('reset')
    expect(iter.Value()).toBe(100)
  })
})
