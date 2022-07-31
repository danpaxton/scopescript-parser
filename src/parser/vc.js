"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
const result_1 = require("./result");
const a = require("./ast");


// getDuplicate<T>(a: T[]): T | undefined
const getDuplicate = a => {
    a.sort();
    for(let i = 0; i < a. length - 1; ++i) {
        if (a[i] === a[i + 1]) { return  a[i]; }
    }
    return undefined;
}

const builtInFuncs = ['type', 'ord', 'abs', 'bool', 'str', 'len', 'int', 'print', 'float']

// addNames(arr: String[], vars: Set): Set
const addNames = (arr, vars) => arr.reduce((acc, e) => typeof(e) === 'string' ? acc.add(e) : (e.kind === 'identifier' ? acc.add(e.name) : acc), vars);


// vcExpr(boundVars: Set, expr: Expr): OK | Error | Unreachable
function vcExpr(boundVars, expr) {
    switch(expr.kind) {
        case 'integer': // fall
        case 'float': //...
        case 'boolean': // ...
        case 'string': // through
        case 'null' : {
            return result_1.ok(undefined);
        }
        case 'call': {
            const x = expr.fun
            if (x.kind === 'variable') {
                if (boundVars.contains(x.name) || builtInFuncs.some(e => e === x.name)) {
                    return result_1.foldLeft(vcExpr, boundVars, expr.args);
                } else {
                    return result_1.error(`Line ${expr.line}: function ${x.name}(...) is not defined.`)
                }
            }
            return vcExpr(boundVars, x)
                        .then(_ => result_1.foldLeft(vcExpr, boundVars, expr.args));
        }
        case 'attribute': {
            const x = expr.collection;
            if (x.kind === 'variable') {
                if (boundVars.contains(x.name)) {
                    return result_1.ok(boundVars);
                }
                else if(builtInFuncs.some(e => e === x.name)) {
                    return result_1.error(`Line ${expr.line}: built-in funtion ${x.name}(...) cannot be referenced.`); 
                } else {
                    return result_1.error(`Line ${expr.line}: collection '${x.name}' is not defined.`);                
                }
            }
            return vcExpr(boundVars, x)
        }
        case 'subscriptor': {
            const x = expr.collection;
            if (x.kind === 'variable') {
                if (boundVars.contains(x.name)) {
                    return vcExpr(boundVars, expr.expr);
                }
                else if(builtInFuncs.some(e => e === x.name)) {
                    return result_1.error(`Line ${expr.line}: built-in funtion ${x.name}(...) is not subscriptable.`) 
                }
                else {
                    return result_1.error(`Line ${expr.line}: collection '${x.name}' is not defined.`);                
                }
            }
            return vcExpr(boundVars, x)
                .then(_ => vcExpr(boundVars, expr.expr))
        }
        case 'closure': {
            const x = getDuplicate(expr.params);
            if (x !== undefined) {
                return result_1.error(`Line ${expr.line}: duplicate closure parameter '${x}'.`);
            } else {
                return vcBlock(addNames(expr.params, boundVars), expr.body);
            }
        }
        case 'variable': {
            const x = expr.name
            if (boundVars.contains(x)) {
                return result_1.ok(boundVars);
            } else {
                return result_1.error(`Line ${expr.line}: variable '${x}' is not defined.`);
            }
        }
        case 'unop': {
            return vcExpr(boundVars, expr.expr);
        }
        case 'binop': {
            return vcExpr(boundVars, expr.e1)
                .then(_ => vcExpr(boundVars, expr.e2));
        }
        case 'ternary': {
            return vcExpr(boundVars, expr.test)
                .then(_ => vcExpr(boundVars, expr.trueExpr))
                .then(_ => vcExpr(boundVars, expr.falseExpr))
        }
        case 'collection': {
            return result_1.foldLeft(vcStmt, boundVars, Object.entries(expr.value).map(pair => a.assignment([pair[0]], pair[1])));
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
