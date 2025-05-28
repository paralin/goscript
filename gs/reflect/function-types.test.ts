import { describe, it, expect } from 'vitest';
import { TypeOf } from './type.js';

describe('Function Type Detection', () => {
    it('should detect regular function types', () => {
        const regularFunc = function(x: number, y: number) { return x + y; };
        const type = TypeOf(regularFunc);
        expect(type.String()).toMatch(/^func/);
        expect(type.Kind().String()).toBe('func');
    });

    it('should detect GoScript typed functions with __goTypeName', () => {
        // Test Greeter function type
        const greetFunc = function(name: string) { return "Hello, " + name; };
        Object.assign(greetFunc, { __goTypeName: 'Greeter' });
        const greetType = TypeOf(greetFunc);
        expect(greetType.String()).toBe('func(string) string');
        expect(greetType.Kind().String()).toBe('func');

        // Test Adder function type
        const addFunc = function(a: number, b: number) { return a + b; };
        Object.assign(addFunc, { __goTypeName: 'Adder' });
        const addType = TypeOf(addFunc);
        expect(addType.String()).toBe('func(int, int) int');
        expect(addType.Kind().String()).toBe('func');
    });

    it('should detect functions with full __typeInfo metadata', () => {
        const complexFunc = function(x: number, y: number) { return x + y; };
        Object.assign(complexFunc, { 
            __goTypeName: 'MyFunc',
            __typeInfo: {
                kind: 'Function',
                params: [
                    { kind: 'Basic', name: 'int' },
                    { kind: 'Basic', name: 'int' }
                ],
                results: [
                    { kind: 'Basic', name: 'int' }
                ]
            }
        });
        
        const type = TypeOf(complexFunc);
        expect(type.String()).toBe('func(int, int) int');
        expect(type.Kind().String()).toBe('func');
    });

    it('should handle functions with multiple return types', () => {
        const multiReturnFunc = function() { return [1, "test"]; };
        Object.assign(multiReturnFunc, { 
            __goTypeName: 'MultiReturn',
            __typeInfo: {
                kind: 'Function',
                params: [],
                results: [
                    { kind: 'Basic', name: 'int' },
                    { kind: 'Basic', name: 'string' }
                ]
            }
        });
        
        const type = TypeOf(multiReturnFunc);
        expect(type.String()).toBe('func() (int, string)');
        expect(type.Kind().String()).toBe('func');
    });

    it('should handle functions with no parameters', () => {
        const noParamFunc = function() { return 42; };
        Object.assign(noParamFunc, { 
            __goTypeName: 'NoParam',
            __typeInfo: {
                kind: 'Function',
                params: [],
                results: [
                    { kind: 'Basic', name: 'int' }
                ]
            }
        });
        
        const type = TypeOf(noParamFunc);
        expect(type.String()).toBe('func() int');
        expect(type.Kind().String()).toBe('func');
    });

    it('should handle functions with no return type', () => {
        const voidFunc = function(x: number) { console.log(x); };
        Object.assign(voidFunc, { 
            __goTypeName: 'VoidFunc',
            __typeInfo: {
                kind: 'Function',
                params: [
                    { kind: 'Basic', name: 'int' }
                ],
                results: []
            }
        });
        
        const type = TypeOf(voidFunc);
        expect(type.String()).toBe('func(int)');
        expect(type.Kind().String()).toBe('func');
    });

    it('should fallback to generic func for unknown typed functions', () => {
        const unknownFunc = function(x: any) { return x; };
        Object.assign(unknownFunc, { __goTypeName: 'UnknownType' });
        
        const type = TypeOf(unknownFunc);
        expect(type.String()).toBe('func');
        expect(type.Kind().String()).toBe('func');
    });

    it('should handle arrow functions', () => {
        const arrowFunc = (x: number) => x * 2;
        const type = TypeOf(arrowFunc);
        expect(type.String()).toMatch(/^func/);
        expect(type.Kind().String()).toBe('func');
    });

    it('should detect functions that return values vs void functions', () => {
        // Function with return
        const returningFunc = function(x: number) { return x * 2; };
        const returnType = TypeOf(returningFunc);
        expect(returnType.String()).toMatch(/func.*any$/);

        // Function without return (void)
        const voidFunc = function(x: number) { console.log(x); };
        const voidType = TypeOf(voidFunc);
        // Should not have return type suffix
        expect(voidType.String()).not.toMatch(/func.*any$/);
    });
}); 