# Issues with Slice Implementation in TypeScript

After comparing the expected output (from Go) with the actual output (from TypeScript), several issues with the slice implementation in TypeScript have been identified:

## 1. Slice Capacity Calculation

In Go, when creating a slice from an array or another slice, the capacity extends from the starting index to the end of the underlying array. The TypeScript implementation does not correctly calculate capacity:

- In "Create slice with specific indices": Go reports `cap(sliceIndices)` as 3, TypeScript reports 2
- In "Append sub-slice w/in capacity": Go reports `cap(appendSlice1)` as 5, TypeScript reports 2
- In "Slicing a slice": Go reports `cap(subSlice1)` as 5, TypeScript reports 3

## 2. Shared Backing Array Behavior

Go slices share the same backing array until an append operation that exceeds capacity. The TypeScript implementation doesn't correctly model this sharing:

- In "Modify slice, check array": After modifying a slice, Go shows the original array is updated, but TypeScript doesn't
- In "Modify array, check slice": After modifying an array, Go shows the slice reflects the change, but TypeScript doesn't
- In "Append sub-slice w/in capacity": In Go, appending to a slice modifies the original array; this doesn't happen in TypeScript

## 3. Three-index Slicing

Go's three-index slice notation (`slice[low:high:max]`) limits the capacity of the resulting slice. The TypeScript implementation doesn't handle this correctly:

- In "Three-index slicing": Go reports `cap(threeIndexSlice)` as 3 and shows changes to the original array after append, TypeScript reports capacity as 2 and doesn't update the original array

## 4. Append Operation Semantics

The append operation in Go has specific semantics regarding when a new backing array is allocated and how capacity grows:

- In "Append to inner slice": Go grows capacity to 4, TypeScript only to 3
- In "Append to inner slice exceeding capacity": Go grows capacity to 6, TypeScript to 5
- In "Append a new slice to slice of slices" and "Append an existing slice to slice of slices": Different capacity values between Go and TypeScript

## 5. Reference Semantics After Append

In Go, append creates a copy of the slice header, but the underlying array may be shared if capacity permits:

- In "Modify appended existing slice": In Go, modifying the source slice after appending doesn't affect the appended copy, but in TypeScript it does, suggesting incorrect reference semantics

## Implementation recommendations:

1. Fix the capacity calculation in the `$.slice()` function to extend from the start index to the end of the underlying array
2. Ensure proper sharing of backing arrays between slices and arrays
3. Correctly implement three-index slicing to properly limit capacity
4. Fix the append operation to follow Go's growth semantics and correctly decide when to allocate a new backing array
5. Ensure proper copy semantics for slice headers during append operations
