"use strict";

Object.defineProperty(exports, "__esModule", { value: true });

// type Expr
const null_ = line => {
    return { kind: 'null', line };
}
exports.null_ = null_
const bool = (value, line) => {
    return { kind: 'boolean', value, line };
}
exports.bool = bool;
const integer = (value, line) => {
    return { kind: 'integer', value, line };
}
exports.integer = integer;
const float = (value, line) => {
    return { kind: 'float', value, line };
}
exports.float = float;
const string = (value, line) => {
    return { kind: 'string', value, line };
}
exports.string = string;
const identifier = (name, line) => {
    return { kind: 'identifier', name, line };
}
exports.identifier = identifier;
const variable = ( name, line) => {
    return { kind: 'variable', name, line };
}
exports.variable = variable;
const unop = (op,  expr, line) => {
    return { kind: 'unop', op,  expr, line };
}
exports.unop = unop;
const binop = (op, e1, e2, line) => {
    return { kind: 'binop', op, e1, e2, line };
}
exports.binop = binop;
const call = (fun, args, line) => {
    return { kind: 'call', fun, args, line }; 
}
exports.call = call;
const closure = (params, body, line) => {
    return { kind: 'closure', params, body, line };
}
exports.closure = closure;
const attribute = (collection, attribute, line) => {
    return { kind: 'attribute', collection , attribute, line };
}
exports.attribute = attribute;
const subscriptor = (collection, expr, line) => {
    return { kind: 'subscriptor', collection, expr, line };
}
exports.subscriptor = subscriptor;
const collection = (value, line) => {
    return { kind: 'collection', value, line };
}
exports.collection = collection
const ternary = (test, trueExpr, falseExpr, line) => {
    return { kind: 'ternary', test, trueExpr, falseExpr, line }
}
exports.ternary = ternary;


// type Stmt
const static_ =  expr => {
    return { kind: 'static',  expr };
}
exports.static_ = static_;
const assignment = (assignArr,  expr) => {
    return { kind: 'assignment', assignArr,  expr };
}
exports.assignment = assignment;
const if_ = (truePartArr, falsePart) => {
    return { kind: 'if', truePartArr, falsePart };
}
exports.if_ = if_;
const for_ = (inits, test, updates, body) => {
    return { kind: 'for', inits, test, updates, body };
}
exports.for_ = for_;
const while_ = (test, body) => {
    return { kind: 'while', test, body };
}
exports.while_ = while_;
const return_ =  (expr, line) => {
    return { kind: 'return', expr, line };
}
exports.return_ = return_;
const delete_ =  (expr, line) => {
    return { kind: 'delete', expr, line };
}
exports.delete_ = delete_
const break_ = line => {
    return { kind: 'break', line };
}
exports.break_ = break_
const continue_ = line => {
    return { kind: 'continue', line };
}
exports.continue_ = continue_