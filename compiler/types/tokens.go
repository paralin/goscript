package types

import (
	"go/token"
)

var tokenMap = map[token.Token]string{
	token.ADD: "+",
	token.SUB: "-",
	token.MUL: "*",
	token.QUO: "/",
	token.REM: "%",
	token.OR:  "|",
	token.XOR: "^",
	token.SHL: "<<",
	token.SHR: ">>",

	token.ADD_ASSIGN: "+=",
	token.SUB_ASSIGN: "-=",
	token.MUL_ASSIGN: "*=",
	token.QUO_ASSIGN: "/=",
	token.REM_ASSIGN: "%=",

	token.AND_ASSIGN:     "&=",
	token.OR_ASSIGN:      "|=",
	token.XOR_ASSIGN:     "^=", // TODO: check if this works
	token.SHL_ASSIGN:     "<<=",
	token.SHR_ASSIGN:     ">>=",
	token.AND_NOT_ASSIGN: "&^=",

	token.LAND: "&&",
	token.LOR:  "||",
	// token.ARROW: ""
	token.INC:    "++",
	token.DEC:    "--",
	token.EQL:    "==",
	token.LSS:    "<",
	token.GTR:    ">",
	token.ASSIGN: "=",
	token.NOT:    "!",

	token.NEQ:      "!=",
	token.LEQ:      "<=",
	token.GEQ:      ">=",
	token.DEFINE:   "=",   // :=
	token.ELLIPSIS: "...", // TODO

	token.LPAREN: "(",
	token.LBRACK: "[",
	token.LBRACE: "{",
	token.COMMA:  ",",
	token.PERIOD: ".",

	token.RPAREN:    ")",
	token.RBRACK:    "]",
	token.RBRACE:    "}",
	token.SEMICOLON: ";",
	token.COLON:     ":",
}

// TokenToTs looks up the typescript version of a token.
func TokenToTs(tok token.Token) (string, bool) {
	t, ok := tokenMap[tok]
	return t, ok
}
