package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
	// "strings" // isProtobufType uses strings, but it's a method on 'c'
)

// writeProtobufMethodCall handles protobuf method calls in expression context
// Returns true if the call was handled as a protobuf method, false otherwise
func (c *GoToTSCompiler) writeProtobufMethodCall(exp *ast.CallExpr) (bool, error) {
	selectorExpr, ok := exp.Fun.(*ast.SelectorExpr)
	if !ok {
		return false, nil
	}

	methodName := selectorExpr.Sel.Name

	// Check if this is a protobuf method call
	if methodName == "MarshalVT" || methodName == "UnmarshalVT" || methodName == "MarshalJSON" || methodName == "UnmarshalJSON" {
		// Get the receiver type
		if receiverType := c.pkg.TypesInfo.TypeOf(selectorExpr.X); receiverType != nil {
			// Handle pointer types
			if ptrType, ok := receiverType.(*types.Pointer); ok {
				receiverType = ptrType.Elem()
			}

			// Check if the receiver is a protobuf type
			if c.isProtobufType(receiverType) {
				if namedType, ok := receiverType.(*types.Named); ok {
					typeName := namedType.Obj().Name()

					switch methodName {
					case "MarshalVT":
						// Transform msg.MarshalVT() to ExampleMsg.toBinary(msg)
						c.tsw.WriteLiterally(typeName)
						c.tsw.WriteLiterally(".toBinary(")
						if err := c.WriteValueExpr(selectorExpr.X); err != nil {
							return true, fmt.Errorf("failed to write receiver for MarshalVT: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return true, nil
					case "MarshalJSON":
						// Transform msg.MarshalJSON() to ExampleMsg.toJsonString(msg)
						c.tsw.WriteLiterally(typeName)
						c.tsw.WriteLiterally(".toJsonString(")
						if err := c.WriteValueExpr(selectorExpr.X); err != nil {
							return true, fmt.Errorf("failed to write receiver for MarshalJSON: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return true, nil
					case "UnmarshalVT":
						// Transform out.UnmarshalVT(data) to ExampleMsg.fromBinary(data)
						c.tsw.WriteLiterally(typeName)
						c.tsw.WriteLiterally(".fromBinary($.normalizeBytes(")
						if len(exp.Args) > 0 {
							if err := c.WriteValueExpr(exp.Args[0]); err != nil {
								return true, fmt.Errorf("failed to write argument for UnmarshalVT: %w", err)
							}
						}
						c.tsw.WriteLiterally("))")
						return true, nil
					case "UnmarshalJSON":
						// Transform out.UnmarshalJSON(data) to ExampleMsg.fromJsonString(data)
						c.tsw.WriteLiterally(typeName)
						c.tsw.WriteLiterally(".fromJsonString(")
						if len(exp.Args) > 0 {
							if err := c.WriteValueExpr(exp.Args[0]); err != nil {
								return true, fmt.Errorf("failed to write argument for UnmarshalJSON: %w", err)
							}
						}
						c.tsw.WriteLiterally(")")
						return true, nil
					}
				}
			}
		}
	}

	return false, nil
}
