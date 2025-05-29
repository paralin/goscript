import * as $ from "@goscript/builtin/builtin.js";

let code1 = $.arrayToSlice<number>([0x30, 0x39])

let code2 = $.arrayToSlice<number>([0x9, 0xa, 0xc, 0xd, 0x20, 0x20])

let code3 = $.arrayToSlice<number>([0x30, 0x39, 0x41, 0x5a, 0x5f, 0x5f, 0x61, 0x7a])

let perlGroup: Map<string, charGroup> = new Map([["\\d", {class: code1, sign: +1}], ["\\D", {class: code1, sign: -1}], ["\\s", {class: code2, sign: +1}], ["\\S", {class: code2, sign: -1}], ["\\w", {class: code3, sign: +1}], ["\\W", {class: code3, sign: -1}]])

let code4 = $.arrayToSlice<number>([0x30, 0x39, 0x41, 0x5a, 0x61, 0x7a])

let code5 = $.arrayToSlice<number>([0x41, 0x5a, 0x61, 0x7a])

let code6 = $.arrayToSlice<number>([0x0, 0x7f])

let code7 = $.arrayToSlice<number>([0x9, 0x9, 0x20, 0x20])

let code8 = $.arrayToSlice<number>([0x0, 0x1f, 0x7f, 0x7f])

let code9 = $.arrayToSlice<number>([0x30, 0x39])

let code10 = $.arrayToSlice<number>([0x21, 0x7e])

let code11 = $.arrayToSlice<number>([0x61, 0x7a])

let code12 = $.arrayToSlice<number>([0x20, 0x7e])

let code13 = $.arrayToSlice<number>([0x21, 0x2f, 0x3a, 0x40, 0x5b, 0x60, 0x7b, 0x7e])

let code14 = $.arrayToSlice<number>([0x9, 0xd, 0x20, 0x20])

let code15 = $.arrayToSlice<number>([0x41, 0x5a])

let code16 = $.arrayToSlice<number>([0x30, 0x39, 0x41, 0x5a, 0x5f, 0x5f, 0x61, 0x7a])

let code17 = $.arrayToSlice<number>([0x30, 0x39, 0x41, 0x46, 0x61, 0x66])

let posixGroup: Map<string, charGroup> = new Map([[`[:alnum:]`, {class: code4, sign: +1}], [`[:^alnum:]`, {class: code4, sign: -1}], [`[:alpha:]`, {class: code5, sign: +1}], [`[:^alpha:]`, {class: code5, sign: -1}], [`[:ascii:]`, {class: code6, sign: +1}], [`[:^ascii:]`, {class: code6, sign: -1}], [`[:blank:]`, {class: code7, sign: +1}], [`[:^blank:]`, {class: code7, sign: -1}], [`[:cntrl:]`, {class: code8, sign: +1}], [`[:^cntrl:]`, {class: code8, sign: -1}], [`[:digit:]`, {class: code9, sign: +1}], [`[:^digit:]`, {class: code9, sign: -1}], [`[:graph:]`, {class: code10, sign: +1}], [`[:^graph:]`, {class: code10, sign: -1}], [`[:lower:]`, {class: code11, sign: +1}], [`[:^lower:]`, {class: code11, sign: -1}], [`[:print:]`, {class: code12, sign: +1}], [`[:^print:]`, {class: code12, sign: -1}], [`[:punct:]`, {class: code13, sign: +1}], [`[:^punct:]`, {class: code13, sign: -1}], [`[:space:]`, {class: code14, sign: +1}], [`[:^space:]`, {class: code14, sign: -1}], [`[:upper:]`, {class: code15, sign: +1}], [`[:^upper:]`, {class: code15, sign: -1}], [`[:word:]`, {class: code16, sign: +1}], [`[:^word:]`, {class: code16, sign: -1}], [`[:xdigit:]`, {class: code17, sign: +1}], [`[:^xdigit:]`, {class: code17, sign: -1}]])

