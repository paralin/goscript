// Generated file based on test_for_range.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export function main(): void {
	let nums = [2, 3, 4];
	let sum = 0;
	// unknown statement: &ast.RangeStmt{
	//   For: 64,
	//   Key: &ast.Ident{ // p0
	//     NamePos: 68,
	//     Name: "_",
	//     Obj: &ast.Object{
	//       Kind: 4,
	//       Name: "_",
	//       Decl: &ast.AssignStmt{ // p1
	//         Lhs: []ast.Expr{
	//           p0,
	//           &ast.Ident{ // p2
	//             NamePos: 71,
	//             Name: "num",
	//             Obj: &ast.Object{ // p3
	//               Kind: 4,
	//               Name: "num",
	//               Decl: p1,
	//               Data: nil,
	//               Type: nil,
	//             },
	//           },
	//         },
	//         TokPos: 75,
	//         Tok: 47,
	//         Rhs: []ast.Expr{
	//           &ast.UnaryExpr{
	//             OpPos: 0,
	//             Op: 79,
	//             X: &ast.Ident{ // p4
	//               NamePos: 84,
	//               Name: "nums",
	//               Obj: &ast.Object{ // p5
	//                 Kind: 4,
	//                 Name: "nums",
	//                 Decl: &ast.AssignStmt{
	//                   Lhs: []ast.Expr{
	//                     &ast.Ident{
	//                       NamePos: 30,
	//                       Name: "nums",
	//                       Obj: p5,
	//                     },
	//                   },
	//                   TokPos: 35,
	//                   Tok: 47,
	//                   Rhs: []ast.Expr{
	//                     &ast.CompositeLit{
	//                       Type: &ast.ArrayType{
	//                         Lbrack: 38,
	//                         Len: nil,
	//                         Elt: &ast.Ident{
	//                           NamePos: 40,
	//                           Name: "int",
	//                           Obj: nil,
	//                         },
	//                       },
	//                       Lbrace: 43,
	//                       Elts: []ast.Expr{
	//                         &ast.BasicLit{
	//                           ValuePos: 44,
	//                           Kind: 5,
	//                           Value: "2",
	//                         },
	//                         &ast.BasicLit{
	//                           ValuePos: 47,
	//                           Kind: 5,
	//                           Value: "3",
	//                         },
	//                         &ast.BasicLit{
	//                           ValuePos: 50,
	//                           Kind: 5,
	//                           Value: "4",
	//                         },
	//                       },
	//                       Rbrace: 51,
	//                       Incomplete: false,
	//                     },
	//                   },
	//                 },
	//                 Data: nil,
	//                 Type: nil,
	//               },
	//             },
	//           },
	//         },
	//       },
	//       Data: nil,
	//       Type: nil,
	//     },
	//   },
	//   Value: p2,
	//   TokPos: 75,
	//   Tok: 47,
	//   Range: 78,
	//   X: p4,
	//   Body: &ast.BlockStmt{
	//     Lbrace: 89,
	//     List: []ast.Stmt{
	//       &ast.AssignStmt{
	//         Lhs: []ast.Expr{
	//           &ast.Ident{
	//             NamePos: 93,
	//             Name: "sum",
	//             Obj: &ast.Object{ // p6
	//               Kind: 4,
	//               Name: "sum",
	//               Decl: &ast.AssignStmt{
	//                 Lhs: []ast.Expr{
	//                   &ast.Ident{
	//                     NamePos: 54,
	//                     Name: "sum",
	//                     Obj: p6,
	//                   },
	//                 },
	//                 TokPos: 58,
	//                 Tok: 47,
	//                 Rhs: []ast.Expr{
	//                   &ast.BasicLit{
	//                     ValuePos: 61,
	//                     Kind: 5,
	//                     Value: "0",
	//                   },
	//                 },
	//               },
	//               Data: nil,
	//               Type: nil,
	//             },
	//           },
	//         },
	//         TokPos: 97,
	//         Tok: 23,
	//         Rhs: []ast.Expr{
	//           &ast.Ident{
	//             NamePos: 100,
	//             Name: "num",
	//             Obj: p3,
	//           },
	//         },
	//       },
	//     },
	//     Rbrace: 105,
	//   },
	// }
	// 
	console.log("sum:", sum)
	
	// unknown statement: &ast.RangeStmt{
	//   For: 131,
	//   Key: &ast.Ident{ // p0
	//     NamePos: 135,
	//     Name: "i",
	//     Obj: &ast.Object{ // p1
	//       Kind: 4,
	//       Name: "i",
	//       Decl: &ast.AssignStmt{ // p2
	//         Lhs: []ast.Expr{
	//           p0,
	//           &ast.Ident{ // p3
	//             NamePos: 138,
	//             Name: "num",
	//             Obj: &ast.Object{ // p4
	//               Kind: 4,
	//               Name: "num",
	//               Decl: p2,
	//               Data: nil,
	//               Type: nil,
	//             },
	//           },
	//         },
	//         TokPos: 142,
	//         Tok: 47,
	//         Rhs: []ast.Expr{
	//           &ast.UnaryExpr{
	//             OpPos: 0,
	//             Op: 79,
	//             X: &ast.Ident{ // p5
	//               NamePos: 151,
	//               Name: "nums",
	//               Obj: &ast.Object{ // p6
	//                 Kind: 4,
	//                 Name: "nums",
	//                 Decl: &ast.AssignStmt{
	//                   Lhs: []ast.Expr{
	//                     &ast.Ident{
	//                       NamePos: 30,
	//                       Name: "nums",
	//                       Obj: p6,
	//                     },
	//                   },
	//                   TokPos: 35,
	//                   Tok: 47,
	//                   Rhs: []ast.Expr{
	//                     &ast.CompositeLit{
	//                       Type: &ast.ArrayType{
	//                         Lbrack: 38,
	//                         Len: nil,
	//                         Elt: &ast.Ident{
	//                           NamePos: 40,
	//                           Name: "int",
	//                           Obj: nil,
	//                         },
	//                       },
	//                       Lbrace: 43,
	//                       Elts: []ast.Expr{
	//                         &ast.BasicLit{
	//                           ValuePos: 44,
	//                           Kind: 5,
	//                           Value: "2",
	//                         },
	//                         &ast.BasicLit{
	//                           ValuePos: 47,
	//                           Kind: 5,
	//                           Value: "3",
	//                         },
	//                         &ast.BasicLit{
	//                           ValuePos: 50,
	//                           Kind: 5,
	//                           Value: "4",
	//                         },
	//                       },
	//                       Rbrace: 51,
	//                       Incomplete: false,
	//                     },
	//                   },
	//                 },
	//                 Data: nil,
	//                 Type: nil,
	//               },
	//             },
	//           },
	//         },
	//       },
	//       Data: nil,
	//       Type: nil,
	//     },
	//   },
	//   Value: p3,
	//   TokPos: 142,
	//   Tok: 47,
	//   Range: 145,
	//   X: p5,
	//   Body: &ast.BlockStmt{
	//     Lbrace: 156,
	//     List: []ast.Stmt{
	//       &ast.ExprStmt{
	//         X: &ast.CallExpr{
	//           Fun: &ast.Ident{
	//             NamePos: 160,
	//             Name: "println",
	//             Obj: nil,
	//           },
	//           Lparen: 167,
	//           Args: []ast.Expr{
	//             &ast.BasicLit{
	//               ValuePos: 168,
	//               Kind: 9,
	//               Value: "\"index:\"",
	//             },
	//             &ast.Ident{
	//               NamePos: 178,
	//               Name: "i",
	//               Obj: p1,
	//             },
	//             &ast.BasicLit{
	//               ValuePos: 181,
	//               Kind: 9,
	//               Value: "\"value:\"",
	//             },
	//             &ast.Ident{
	//               NamePos: 191,
	//               Name: "num",
	//               Obj: p4,
	//             },
	//           },
	//           Ellipsis: 0,
	//           Rparen: 194,
	//         },
	//       },
	//     },
	//     Rbrace: 197,
	//   },
	// }
	// 
	
	// Test ranging over an array
	let arr = ["a", "b", "c"];
	// unknown statement: &ast.RangeStmt{
	//   For: 265,
	//   Key: &ast.Ident{ // p0
	//     NamePos: 269,
	//     Name: "i",
	//     Obj: &ast.Object{ // p1
	//       Kind: 4,
	//       Name: "i",
	//       Decl: &ast.AssignStmt{ // p2
	//         Lhs: []ast.Expr{
	//           p0,
	//           &ast.Ident{ // p3
	//             NamePos: 272,
	//             Name: "s",
	//             Obj: &ast.Object{ // p4
	//               Kind: 4,
	//               Name: "s",
	//               Decl: p2,
	//               Data: nil,
	//               Type: nil,
	//             },
	//           },
	//         },
	//         TokPos: 274,
	//         Tok: 47,
	//         Rhs: []ast.Expr{
	//           &ast.UnaryExpr{
	//             OpPos: 0,
	//             Op: 79,
	//             X: &ast.Ident{ // p5
	//               NamePos: 283,
	//               Name: "arr",
	//               Obj: &ast.Object{ // p6
	//                 Kind: 4,
	//                 Name: "arr",
	//                 Decl: &ast.AssignStmt{
	//                   Lhs: []ast.Expr{
	//                     &ast.Ident{
	//                       NamePos: 232,
	//                       Name: "arr",
	//                       Obj: p6,
	//                     },
	//                   },
	//                   TokPos: 236,
	//                   Tok: 47,
	//                   Rhs: []ast.Expr{
	//                     &ast.CompositeLit{
	//                       Type: &ast.ArrayType{
	//                         Lbrack: 239,
	//                         Len: &ast.BasicLit{
	//                           ValuePos: 240,
	//                           Kind: 5,
	//                           Value: "3",
	//                         },
	//                         Elt: &ast.Ident{
	//                           NamePos: 242,
	//                           Name: "string",
	//                           Obj: nil,
	//                         },
	//                       },
	//                       Lbrace: 248,
	//                       Elts: []ast.Expr{
	//                         &ast.BasicLit{
	//                           ValuePos: 249,
	//                           Kind: 9,
	//                           Value: "\"a\"",
	//                         },
	//                         &ast.BasicLit{
	//                           ValuePos: 254,
	//                           Kind: 9,
	//                           Value: "\"b\"",
	//                         },
	//                         &ast.BasicLit{
	//                           ValuePos: 259,
	//                           Kind: 9,
	//                           Value: "\"c\"",
	//                         },
	//                       },
	//                       Rbrace: 262,
	//                       Incomplete: false,
	//                     },
	//                   },
	//                 },
	//                 Data: nil,
	//                 Type: nil,
	//               },
	//             },
	//           },
	//         },
	//       },
	//       Data: nil,
	//       Type: nil,
	//     },
	//   },
	//   Value: p3,
	//   TokPos: 274,
	//   Tok: 47,
	//   Range: 277,
	//   X: p5,
	//   Body: &ast.BlockStmt{
	//     Lbrace: 287,
	//     List: []ast.Stmt{
	//       &ast.ExprStmt{
	//         X: &ast.CallExpr{
	//           Fun: &ast.Ident{
	//             NamePos: 291,
	//             Name: "println",
	//             Obj: nil,
	//           },
	//           Lparen: 298,
	//           Args: []ast.Expr{
	//             &ast.BasicLit{
	//               ValuePos: 299,
	//               Kind: 9,
	//               Value: "\"index:\"",
	//             },
	//             &ast.Ident{
	//               NamePos: 309,
	//               Name: "i",
	//               Obj: p1,
	//             },
	//             &ast.BasicLit{
	//               ValuePos: 312,
	//               Kind: 9,
	//               Value: "\"value:\"",
	//             },
	//             &ast.Ident{
	//               NamePos: 322,
	//               Name: "s",
	//               Obj: p4,
	//             },
	//           },
	//           Ellipsis: 0,
	//           Rparen: 323,
	//         },
	//       },
	//     },
	//     Rbrace: 326,
	//   },
	// }
	// 
	
	// Test ranging over a string
	let str = "go";
	
	// Note: c will be a rune (int32)
	// unknown statement: &ast.RangeStmt{
	//   For: 374,
	//   Key: &ast.Ident{ // p0
	//     NamePos: 378,
	//     Name: "i",
	//     Obj: &ast.Object{ // p1
	//       Kind: 4,
	//       Name: "i",
	//       Decl: &ast.AssignStmt{ // p2
	//         Lhs: []ast.Expr{
	//           p0,
	//           &ast.Ident{ // p3
	//             NamePos: 381,
	//             Name: "c",
	//             Obj: &ast.Object{ // p4
	//               Kind: 4,
	//               Name: "c",
	//               Decl: p2,
	//               Data: nil,
	//               Type: nil,
	//             },
	//           },
	//         },
	//         TokPos: 383,
	//         Tok: 47,
	//         Rhs: []ast.Expr{
	//           &ast.UnaryExpr{
	//             OpPos: 0,
	//             Op: 79,
	//             X: &ast.Ident{ // p5
	//               NamePos: 392,
	//               Name: "str",
	//               Obj: &ast.Object{ // p6
	//                 Kind: 4,
	//                 Name: "str",
	//                 Decl: &ast.AssignStmt{
	//                   Lhs: []ast.Expr{
	//                     &ast.Ident{
	//                       NamePos: 361,
	//                       Name: "str",
	//                       Obj: p6,
	//                     },
	//                   },
	//                   TokPos: 365,
	//                   Tok: 47,
	//                   Rhs: []ast.Expr{
	//                     &ast.BasicLit{
	//                       ValuePos: 368,
	//                       Kind: 9,
	//                       Value: "\"go\"",
	//                     },
	//                   },
	//                 },
	//                 Data: nil,
	//                 Type: nil,
	//               },
	//             },
	//           },
	//         },
	//       },
	//       Data: nil,
	//       Type: nil,
	//     },
	//   },
	//   Value: p3,
	//   TokPos: 383,
	//   Tok: 47,
	//   Range: 386,
	//   X: p5,
	//   Body: &ast.BlockStmt{
	//     Lbrace: 396,
	//     List: []ast.Stmt{
	//       &ast.ExprStmt{
	//         X: &ast.CallExpr{
	//           Fun: &ast.Ident{
	//             NamePos: 400,
	//             Name: "println",
	//             Obj: nil,
	//           },
	//           Lparen: 407,
	//           Args: []ast.Expr{
	//             &ast.BasicLit{
	//               ValuePos: 408,
	//               Kind: 9,
	//               Value: "\"index:\"",
	//             },
	//             &ast.Ident{
	//               NamePos: 418,
	//               Name: "i",
	//               Obj: p1,
	//             },
	//             &ast.BasicLit{
	//               ValuePos: 421,
	//               Kind: 9,
	//               Value: "\"value:\"",
	//             },
	//             &ast.Ident{
	//               NamePos: 431,
	//               Name: "c",
	//               Obj: p4,
	//             },
	//           },
	//           Ellipsis: 0,
	//           Rparen: 432,
	//         },
	//       },
	//     },
	//     Rbrace: 469,
	//   },
	// }
	// 
}

