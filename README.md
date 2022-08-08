# Scope Script Parser
View on npm: https://www.npmjs.com/package/scope-script-parser<br>
View interpreter: https://github.com/danpaxton/scope-script-interpreter<br>
View language IDE: https://github.com/danpaxton/scope-script-ide<br>


## Parser
Given code as raw text, the parser converts it into an abstract syntax tree defined by an operator precedence and a set of grammar rules. The parser was built using the Parsimmon libray. Text is parsed left to right in top down manner. The parser is built from larger parse functions built out of smaller parse functions. Specifically, the parser starts by parsing text using simple regular expression parsers. Then, parses expressions using these regex parsers. Then, parses statements using expression parsers. Lastly, parses programs using statements parsers. Operator precedence is handled by building lower precedence operator parsers that use the next highest precedence operator parser as their main parse function. This allows the parser to bind to higher precedence operators before lower precedence operators. The variable checker is used to find cases of undeclared variables, duplicate parameters, valid statment use and invalid built-in function use. It accomplishes this by traversing the abstract syntax tree and maintaining a set of bound variables at each level of the program.


## Installation
Clone repository,
```console
$ git clone https://github.com/danpaxton/scope-script-parser.git`
$ cd scope-script-parser
```
Install and run tests,
```console
$ npm install
$ npm run test
```

Or install package,
```console
$ npm i scope-script-parser
```

## Operator Precedence
The table below summarizes operator precedence from highest precedence to lowest precedence. Operators in the same box have the same precedence. Operators without syntax are binary. All operators group left to right except exponentiation which groups right to left.
Operator| Description
---:| ---
`(expression),`<br>`{key: value...}` | Binding or parenthesized expression,<br> collection display
 `x(...), x.attribute, x[...]` | call, reference, subscriptor
 `!x, ~x, ++x, --x, +x, -x`| logical not, bitwise not, pre-increment, pre-decrement, unary plus, unary negative
 `**` | exponentiation
`*, /, %` | multiplication, division, remainder
`+, -`| addition, subtraction
`<<, >>`| shifts
`&` | bit and
<code>&#124;</code> | bit or
`^` | bit xor
`<, >, <=, >=, !=, ==` | comparisons
`&&` | logical and
<code>&#124;&#124;</code> | logical or
`... ? ... : ...` | ternary 


## Grammar
Below is a set of instructions that define valid statements and expressions for the scope script programming language. Scope script is a procedural and dynamically typed language. Each program consists of a series of statements that change the state of the program.

### Lexical
`type boolean ::= true | false`<br>

`type integer ::= [+-]?[0-9]+`<br>

`type float ::= [+-]?([0-9]+\.?[0-9]*|\.[0-9]+)([eE][+-]?[0-9]+)? | Infinity | -Infinity `<br>

`type string ::= (['"])([^'"]*)\1`<br>

`type name ::= [a-zA-Z_$][a-zA-Z_$0-9]*`<br>

`type none ::= null`<br>

### Operators
`type unop ::= !, ~, ++, --, +, -`<br>

`type binop ::= *, /, %, +, -, <<, >>, |, &, |, ^, >=, <=, ==, !=, >, <, &&, ||`<br>

### Atoms
`type atom ::= { kind: 'null' }`<br>
`| { kind: 'boolean', value: boolean }`<br>
`| { kind: 'integer', value: integer }`<br>
`| { kind: 'float', value: float }`<br>
`| { kind: 'string', value: string }`<br>
`| { kind: 'collection', value: { [ key: string ]: [ value: expression ] } }`<br>
`| { kind: 'variable', name: name }`<br>
`| { kind: 'closure', params: name[], body: Stmt[] }`<br>

### Expressions
`type expression ::= atom`<br>
`| { kind: 'unop', op: unop, expr: expression }`<br>
`| { kind: 'binop', op: binop, e1: expression, e2: expression }`<br>
`| { kind: 'call', fun: expression, args: expression[] }`<br>
`| { kind: 'subscriptor', dict: expression, expression: expression }`<br>
`| { kind: 'attribute', dict: expression, attribute: name }`<br>
`| { kind: 'ternary', test: expression, trueExpr: expression, falseExpr: expression }`<br>

### Statements
`type statement ::= { kind: 'static', expr: expression }`<br>
`| { kind: 'assignment', assignArr: expression[], expr: expression }`<br>
`| { kind: 'if', truePartArr : { test: expression, part: statement[] }[], falsePart: statement[] }`<br>
`| { kind: 'for', inits: statement[], test: expression, updates: statement[], body: statement[] }`<br>
`| { kind: 'while', test: expression, body: statement[]] }`<br>
`| { kind: 'delete', expr: expression }`<br>
`| { kind: 'return', expr: expression }`<br>

### Program
`type program ::= { kind: 'ok', value: statement[] } | {kind: 'error', message: string }`

## Comments
Comments are specified using the `//` characters.<br>

Example,<br>
`// integer value.`<br>
`x = 10;`


## Null values
The absence of a value is specified using the `null` keyword.<br>

Example,<br>
`a = null;`


## Boolean
Boolean values are represented using `true` or `false`.<br>

Example,<br>
`a = true`, true assignment.<br>
`if (false) { ... }`, conditional test.


## Numbers
Numbers are represented as integers, decimal point numbers, scientific notaion numbers, or infinity.<br>

Example,<br>
`1`, integer.<br>

`-3.66`, decimal point.<br>

`2.67e-100`, scientific notation.<br>

`Infinity`, infinity.<br>

Decimal point numbers, scientific notation numbers, and infinity are all interpreted as float values.


## Strings
Strings are represented as a sequence of ascii characters between a matching pair of single or double quotes.<br>

Example,<br>
`''`, empty string.<br>

`' str1 '`, single quotes.<br>

`" str2 "`, double quotes.<br>

Strings can be subscripted at character positions.<br>
`'abc'[1]` is equivalent to `'b'`.


## Operators
Define an expression using a binary or unary operator.<br>

### Unary Operators
Syntax,<br>
`unop expression`<br>

Example,<br>
`!x`, `++x`<br>

### Binary Operators
Syntax,<br>
`expression binop expression`<br>

Example,<br>
`2 ** 8`, `true && false`, `a == b`<br>

### Bitwise Operators
Bitwise Operators only operate on integers.<br>

Example,<br>
`~5`, `1 >> 2`<br>

Error,<br>
`1.5 >> 2.5`<br>

### Comparison chaining
Chaining comparsions will test each comparsion seperated by a logical AND (&&).<br>

Example,<br>
`1 < 2 < 3`, is equivalent to `1 < 2 && 2 < 3`.<br>

`1 == 2 < 3 != 4`, is equivalent to `1 == 2 && 2 < 3 && 3 != 4`.<br>


## Built-in functions
Built in functions with default return values unless overwritten.<br>

`type(..)`, returns the argument type.<br>

`ord(..)`, returns the ASCII value of character argument.<br>

`abs(..)`, returns the absolute value of number argument.<br>

`pow(..)`, returns the first argument to the power of the second argument..<br>

`len(..)`, returns the length of the collection or string argument.<br>

`bool(..)`, returns the boolean representation of the argument.<br>

`int(..)`, returns the greatest integer less than or equal to the argument.<br>

`float(..)`, returns the float representation of the argument.<br>

`str(..)`, returns the string represenation of the argument.<br>

`print(.. , ...)`, displays arguments to output.<br>

## Assignment statement
Assign a variable, or a collection attribute to an expression.<br>

Syntax,<br>
`x = expression;`<br>
`x.attribute = expression;`<br>
`x[...] = expression;`

### Basic assignment
Example,<br>
`a = 1;`<br>

Assign multiple variables, or attributes the same value using an assignment chain.<br>
`a = b['key'] = c.val = 1;`<br>

### Compound assignment
`'+=' | '-=' | '*=' | '//=' | '/=' | '%=' | '<<=' | '>>=' | '&=' | '^=' | '|='`<br>

A variable must be defined before compound assignment.<br>

Example,
`a = 1; a += 1;`<br>

A compound assigment and the equivalent simple assignment will be parsed into the same result.<br>
`a += 1;` is the same as `a = a + 1;`<br>

Assignment types cannot be mixed.<br>
`a = b += 1;` will result in a parse error.


## Closures
Store parameters, function code, and a link to lexical environment.<br>

No parameters,<br>
`foo = () => { message = 'Hello'; return message; }; foo();`

Single parameter,<br>
`foo = p => { return p + 1; }; foo(10);`

Multiple parameter,<br>
`foo = (a, b, c) => { return a + b + c; }; foo(1, 2, 3);`

Return line,<br>
`foo = (a, b) => { return a + b; };`, using return line `foo = (a, b) => a + b;`<br>

Both methods will be parsed into the same result. Using no brackets allows only the one return statement.

Currying,<br>
`foo = a => b => c => a + b + c; foo(1)(2)(3);`


## Collections
Store a collection of attributes mapped to a value.<br>

Empty,<br>
`data = {};`<br>

New attributes,<br>
`data = {}; data['key'] = 1; data.number = 10;`<br>

`data` is now equivalent to `{ 'key': 1, 'number': 10 }`.<br>

Names,<br>
`data = { a: 1, 2: true };`, is the same as `data = { 'a': 1, '2': true };`.<br>

Numbers,<br>
`data = { 1: 1, 2: true }`<br> 

Strings,<br>
`data = { ' ': 1, 'key': true }`

Only named attributes can be accesed using the reference ( `x.attribute` ) operator. Any attribute can be accesed using the subscriptor ( `x[...]` ) operator. All attributes are stored as strings, `x[1]` is the same as `x['1']`.<br>

Example,<br>
`data = { 1: 1, key: true, ' ': false };`, access attribute `1` using `data[1]`, attribute `' '`
using `data[' ']` and attribute `key` using `data.key` or `data['key']`.<br>


## Ternary
Conditionally make decisions on the expression level. Defined by a test with a true expression and a false expression.<br>

Syntax,<br>
`a = test ? (true) expression : (false) expression;`

Ternary expressions can only contain expressions, use if statements for statement level conditionals.<br>

Nested ternary must be within parentheses.<br>

Example,<br>
`a = test1 ? ( test2 ? 1 : 3 ) : 2;`<br>

Parse error,<br>
`a = test1 ? test2 ? 1 : 3 : 2;`


## `if` statement
Conditionally make decisions on the statement level. Defined by a series of tests with associated parts, and a false part.<br>

Syntax,<br>
`if( test ) { part } else if( test ) { part } ... else { false part }`<br>

`if` statements require brackets for more than one statement.<br>

if only,<br>
`if(true) 1 + 2;`<br>

if else,<br>
`if(true) { 1 + 2; } else { 1 + 2; }`<br>

if else-if,<br>
`if(true) { 1 + 2; } else if(true) { 1 + 2; }`<br>

if else-if else,<br>
`if(true) { 1 + 2; } else if (true) { 1 + 2; } else { 1 + 2; }`<br>


## `while` statement
Loop until termination defined by a test expression. <br>

Syntax, <br>
`while( test ) { body }`<br>

`while` loops require brackets for more than one statement.<br>

Example,<br>
`while(a < 10) ++a;`


## `for` statement
Loop with initializers. Performs updates at each iteration until termination defined by a test expression.<br>

Syntax, <br>
`for( inits , test , updates ) { body }`<br>

`for` statements require all parts. Require brackets for more than one statement.<br>

Initializers must be assignments and update variables must be defined.<br>

Example,<br>
`for(i = 0; i < 10; ++i) 2 + i;`<br>

`for(i = 0, j = z = 1; i < 10; ++i, ++z, --j) { z += j; j += i}`<br>

Errors,<br>

Need all parts, <br>
`for(i = 0; true; ) { 2 + i; }`<br>

`for(; true; ++i) { 2 + i; }`<br>

`z` not defined, <br>
`for(i = 0; i < 10; z = 0) i;`<br>

`true` not an assignment statement, <br>
`for(i = 0, true; i < 10; ++i) i;`<br>


## `return` statement
Returns an expression from a function call.<br>

Syntax, <br>
`return expression;`<br>

Example,<br>
`return 1 + 2;`<br>

No `return` statement or `return;`, are both equivalent to `return null;`.<br>

## `delete` statement
Removes an attribute from a collection.<br>

Syntax,<br>
`delete expression;`<br>

Example,<br>
`a = { 1 : true, a : true };`<br>
`delete a[1];`<br>
`delete a.a;`<br>

`a` is now equivalent to `{}`.

## `continue` statement
Explicitly jump to next loop iteration.<br>

Syntax,<br>
`continue;`

Example,<br>
`for(a = 0; a < 10; ++a) { continue; --a; }`
The loop will run ten times because `a` is never decremented.

## `break` statement
Explicitly step out of loop iteration.<br>

Syntax,<br>
`continue;`

Example,<br>
`while(true) { break; }`
The loop will only run once because it breaks immediately.
