/**
 * Abstract base class for Go structs to reduce generated code verbosity.
 * Handles field management, getters/setters, constructor, and clone method generically.
 */

import { VarRef, varRef } from './varRef.js'

export interface FieldDescriptor<T> {
  type: any
  default: T
  isEmbedded?: boolean
}

export abstract class GoStruct<T extends Record<string, any>> {
  public _fields: { [K in keyof T]: VarRef<T[K]> }
  
  [key: string]: any
  
  constructor(fields: { [K in keyof T]: FieldDescriptor<T[K]> }, init?: any) {
    this._fields = {} as any
    
    for (const [key, desc] of Object.entries(fields) as [keyof T, FieldDescriptor<any>][]) {
      let value: any
      
      if (desc.isEmbedded && init && init[key]) {
        if (init[key] instanceof Object && !(init[key] instanceof Array)) {
          if (init[key]._fields) {
            value = init[key];
          } else {
            const EmbeddedType = desc.default?.constructor;
            if (EmbeddedType && typeof EmbeddedType === 'function') {
              value = new EmbeddedType(init[key]);
            } else {
              value = desc.default;
            }
          }
        } else {
          value = init[key] ?? desc.default;
        }
      } else {
        value = init?.[key] ?? desc.default;
      }
      
      this._fields[key] = varRef(value);
      
      Object.defineProperty(this, key, {
        get: function() { return this._fields[key].value },
        set: function(value) { this._fields[key].value = value },
        enumerable: true,
        configurable: true
      });
    }
    
    for (const [key, desc] of Object.entries(fields) as [keyof T, FieldDescriptor<any>][]) {
      if (desc.isEmbedded && this._fields[key].value) {
        this._promoteEmbeddedFields(key as string, this._fields[key].value);
      }
    }
  }
  
  private _promoteEmbeddedFields(embeddedKey: string, embeddedValue: any): void {
    if (!embeddedValue || typeof embeddedValue !== 'object') return
    
    if (embeddedValue._fields) {
      for (const [fieldKey, fieldRef] of Object.entries(embeddedValue._fields)) {
        if (this.hasOwnProperty(fieldKey)) continue
        
        Object.defineProperty(this, fieldKey, {
          get: function() { return this._fields[embeddedKey].value[fieldKey] },
          set: function(value) { this._fields[embeddedKey].value[fieldKey] = value },
          enumerable: true,
          configurable: true
        })
      }
    }
    
    const proto = Object.getPrototypeOf(embeddedValue)
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor' || key.startsWith('_') || this.hasOwnProperty(key)) continue
      
      const descriptor = Object.getOwnPropertyDescriptor(proto, key)
      if (descriptor && typeof descriptor.value === 'function') {
        this[key] = function(...args: any[]) {
          const currentEmbeddedValue = this._fields[embeddedKey].value
          return currentEmbeddedValue[key].apply(currentEmbeddedValue, args)
        }
      }
    }
  }
  
  clone(): this {
    // Create a new instance using the constructor
    const Constructor = this.constructor as new () => this
    const cloned = new Constructor()
    
    for (const key in this._fields) {
      if (Object.prototype.hasOwnProperty.call(this._fields, key)) {
        const value = this._fields[key].value
        
        if (value === null || value === undefined) {
          cloned._fields[key].value = value
        } else if (typeof value === 'object') {
          if (typeof value.clone === 'function') {
            cloned._fields[key].value = value.clone()
          } else if (Array.isArray(value)) {
            cloned._fields[key].value = [...value] as any
          } else if (value && typeof value === 'object' && value.constructor && value.constructor.name !== 'Object') {
            const Constructor = value.constructor as any
            if (typeof Constructor === 'function') {
              try {
                const newObj = new Constructor()
                for (const prop in value) {
                  if (Object.prototype.hasOwnProperty.call(value, prop)) {
                    newObj[prop] = value[prop]
                  }
                }
                cloned._fields[key].value = newObj
              } catch (e) {
                cloned._fields[key].value = {...value}
              }
            } else {
              cloned._fields[key].value = {...value}
            }
          } else {
            cloned._fields[key].value = {...value}
          }
        } else {
          cloned._fields[key].value = value
        }
      }
    }
    
    return cloned
  }
}
