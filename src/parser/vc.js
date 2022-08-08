"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
const result_1 = require("./result");
const a = require("./ast");


// getDuplicate<T>(a: T[]): T | undefined
const getDuplicate = a => {
    const set = new Set();
    let i, c;
    for(i = 0; i < a.length; ++i) {
        c = a[i];
        if (set.has(c))
            return c
        
        set.add(c);
    }
    
    return undefined
}

const builtInFuncs = ['type', 'ord', 'abs', 'bool', 'str', 'len', 'int', 'print', 'float', 'pow']

// addNames(arr: String[], vars: Set): Set
const addNames = (arr, vars) => arr.reduce((acc, e) => typeof(e) === 'string' ? acc.add(e) : (e.kind === 'identifier' ? acc.add(e.name) : acc), vars);


// vcExpr(boundVars: Set, expression: Expr): OK | Error | Unreachable
function vcExpr(boundVars, expression) {
    switch(expression.kind) {
        case 'integer': // fall
        case 'float': //...
        case 'boolean': // ...
        case 'string': // through
        case 'null' : {
            return result_1.ok(undefined);
        }
        case 'call': {
            const x = expression.fun
            if (x.kind === 'variable') {
                if (boundVars.contains(x.name) || builtInFuncs.some(e => e === x.name)) {
                    return result_1.foldLeftNoAcc(vcExpr, boundVars, expression.args);
                } else {
                    return result_1.error(`Line ${expression.line}: function ${x.name}(...) is not defined.`)
                }
            }
            return vcExpr(boundVars, x)
                        .then(_ => result_1.foldLeftNoAcc(vcExpr, boundVars, expression.args));
        }
        case 'attribute': {
            const x = expression.collection;
            if (x.kind === 'variable') {
                if (boundVars.contains(x.name)) {
                    return result_1.ok(boundVars);
                }
                else if(builtInFuncs.some(e => e === x.name)) {
                    return result_1.error(`Line ${expression.line}: built-in funtion ${x.name}(...) cannot be referenced.`); 
                } else {
                    return result_1.error(`Line ${expression.line}: collection '${x.name}' is not defined.`);                
                }
            }
            return vcExpr(boundVars, x)
        }
        case 'subscriptor': {
            const x = expression.collection;
            if (x.kind === 'variable') {
                if (boundVars.contains(x.name)) {
                    return vcExpr(boundVars, expression.expr);
                }
                else if(builtInFuncs.some(e => e === x.name)) {
                    return result_1.error(`Line ${expression.line}: built-in funtion ${x.name}(...) is not subscriptable.`) 
                }
                else {
                    return result_1.error(`Line ${expression.line}: collection '${x.name}' is not defined.`);                
                }
            }
            return vcExpr(boundVars, x)
                .then(_ => vcExpr(boundVars, expression.expr))
        }
        case 'closure': {
            const x = getDuplicate(expression.params);
            if (x !== undefined) {
                return result_1.error(`Line ${expression.line}: duplicate closure parameter '${x}'.`);
            } else {
                return vcBlock(addNames(expression.params, boundVars), expression.body);
            }
        }
        case 'variable': {
            const x = expression.name
            if (boundVars.contains(x)) {
                return result_1.ok(boundVars);
            } else {
                return result_1.error(`Line ${expression.line}: variable '${x}' is not defined.`);
            }
        }
        case 'unop': {
            return vcExpr(boundVars, expression.expr);
        }
        case 'binop': {
            return vcExpr(boundVars, expression.e1)
                .then(_ => vcExpr(boundVars, expression.e2));
        }
        case 'ternary': {
            return vcExpr(boundVars, expression.test)
                .then(_ => vcExpr(boundVars, expression.trueExpr))
                .then(_ => vcExpr(boundVars, expression.falseExpr))
        }
        case 'collection': {
            return result_1.foldLeft(vcStmt, boundVars, Object.entries(expression.value).map(pair => a.assignment([pair[0]], pair[1])));
        }
        default: {
            return result_1.unreachable('unhandled case');
        }
    }
}


// vcBlock(env: Set, statements: Stmt[]): OK | Error | Unreachable
function vcBlock(env, statements) {
    return result_1.foldLeft(vcStmt, env, statements);
}


/* returns the environment because assignment statements declare variables that
    are visible to the next statement.*/
// vcStmt(env: Set, stmt: Stmt): Set
function vcStmt(env, stmt) {
    switch(stmt.kind) {
        case 'assignment': {
            return vcExpr(stmt.expr.kind === 'closure' ? addNames(stmt.assignArr, env) : env, stmt.expr)
                .map(_ => addNames(stmt.assignArr, env));
        }
        case 'if': {
            return result_1.foldLeftNoAcc(vcExpr, env, stmt.truePartArr.map(s => s.test))
                .then(_ => result_1.foldLeftNoAcc(vcBlock, env, stmt.truePartArr.map(s => s.part)))
                .then(_ => vcBlock(env, stmt.falsePart))
                .map(_=> env);
        }
        case 'for': {
            return result_1.foldLeft(vcStmt, env, stmt.inits)
                .then(env => vcExpr(env, stmt.test)
                .then(_ => result_1.foldLeftNoAcc((env, c) => {
                        if (c.kind === 'assignment') {
                            return c.assignArr.reduce((acc, e) => {
                                if (acc.getKind() === 'error') {
                                    return acc;
                                }
                                else if (e.kind == 'identifier') {
                                    acc = env.contains(e.name) ? acc // remains OK
                                        : result_1.error(`Line ${e.line}: loop update variable '${e.name}' must be defined.`);
                                } else { // attribute reference or subscriptor otherwise
                                    acc = vcExpr(env, e);
                                }
                                return acc;
                            }, result_1.ok(undefined))
                        } else { // static otherwise
                            return vcExpr(env, c.expr);
                        }
                    }, env, stmt.updates))
                .then(_ => vcBlock(env, stmt.body)))
                .map(_ => env);
        }
        case 'while': {
            return vcExpr(env, stmt.test)
                .then(_ => vcBlock(env, stmt.body))
                .map(_ => env);
        }
        case 'delete': {
            const x = stmt.expr
            if (x.kind !== 'subscriptor' && x.kind !== 'attribute') {
                return result_1.error(`Line ${x.line}: delete(...) argument must be a collection attribute.`)
            }
            return vcExpr(env, x)
                .map(_ => env)
        }
        case 'return': // fall through
        case 'static': {
            return vcExpr(env, stmt.expr)
                .map(_ => env);
        }
        case 'break': // fall through
        case 'continue': {
            return result_1.ok(undefined).map(_ => env);
        }
        default: {
            return result_1.unreachable('unhandled case');
        }
    }
}
/*
  A simple "variable-checker", which only ensures that (1) variables are
  declared before they are used, (2) there are no duplicate parameters in closure definitions
  (3) Valid built-in function use, (4) Valid delete use.
 */
// vc(stmts: Stmts[]): Undefined
function vc(stmts) {
    return vcBlock(immutable_1.Set.of(), stmts)
        .map(_ => undefined);
}
exports.vc = vc;
