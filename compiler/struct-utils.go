package compiler

import (
	"fmt"
	"go/types"
	"sort"
	"strings"
)

func (c *GoToTSCompiler) generateStructFieldsTypeString(structType types.Type) string {
	if ptr, ok := structType.(*types.Pointer); ok {
		structType = ptr.Elem()
	}

	var namedType *types.Named
	if named, ok := structType.(*types.Named); ok {
		namedType = named
		structType = named.Underlying()
	}

	structObj, ok := structType.(*types.Struct)
	if !ok {
		return "any"
	}

	fieldMap := make(map[string]string)
	for i := 0; i < structObj.NumFields(); i++ {
		field := structObj.Field(i)
		if !field.Exported() && (namedType == nil || field.Pkg() != namedType.Obj().Pkg()) {
			continue
		}

		fieldName := field.Name()
		if fieldName == "_" {
			continue
		}

		if field.Anonymous() {
			embeddedFields := c.generateStructFieldsTypeString(field.Type())
			if embeddedFields != "any" {
				embeddedFields = strings.TrimPrefix(embeddedFields, "{")
				embeddedFields = strings.TrimSuffix(embeddedFields, "}")
				
				embeddedPairs := strings.Split(embeddedFields, ", ")
				for _, pair := range embeddedPairs {
					if pair == "" {
						continue
					}
					parts := strings.SplitN(pair, ": ", 2)
					if len(parts) == 2 {
						fieldMap[parts[0]] = parts[1]
					}
				}
			}
			continue
		}

		fieldMap[fieldName] = c.getTypeString(field.Type())
	}

	var fieldNames []string
	for name := range fieldMap {
		fieldNames = append(fieldNames, name)
	}
	sort.Strings(fieldNames)

	var fieldDefs []string
	for _, fieldName := range fieldNames {
		fieldDefs = append(fieldDefs, fmt.Sprintf("%s?: %s", fieldName, fieldMap[fieldName]))
	}

	return strings.Join(fieldDefs, ", ")
}
