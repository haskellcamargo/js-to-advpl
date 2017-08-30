import * as t from "babel-types";

const PRECEDENCE = {
    "||": 0,
    "&&": 1,
    "|": 2,
    "^": 3,
    "&": 4,
    "==": 5,
    "===": 5,
    "!=": 5,
    "!==": 5,
    "<": 6,
    ">": 6,
    "<=": 6,
    ">=": 6,
    in: 6,
    instanceof: 6,
    ">>": 7,
    "<<": 7,
    ">>>": 7,
    "+": 8,
    "-": 8,
    "*": 9,
    "/": 9,
    "%": 9,
    "**": 10
};

export function NullableTypeAnnotation(node, parent) {
    return t.isArrayTypeAnnotation(parent);
}

export {
    NullableTypeAnnotation as FunctionTypeAnnotation
};

export function UpdateExpression(node, parent) {
    // (foo++).test()
    return t.isMemberExpression(parent) && parent.object === node;
}

export function ObjectExpression(node, parent, printStack) {
    return isFirstInStatement(printStack, {
        considerArrow: true
    });
}

export function DoExpression(node, parent, printStack) {
    return isFirstInStatement(printStack);
}

export function Binary(node, parent) {
    if (
        ((t.isCallExpression(parent) || t.isNewExpression(parent)) && parent.callee === node) ||
        t.isUnaryLike(parent) ||
        (t.isMemberExpression(parent) && parent.object === node) ||
        t.isAwaitExpression(parent)
    ) {
        return true;
    }

    if (t.isBinary(parent)) {
        const parentOp = parent.operator;
        const parentPos = PRECEDENCE[parentOp];

        const nodeOp = node.operator;
        const nodePos = PRECEDENCE[nodeOp];

        if (
            // Logical expressions with the same precedence don't need parens.
            (parentPos === nodePos && parent.right === node && !t.isLogicalExpression(parent)) ||
            parentPos > nodePos
        ) {
            return true;
        }
    }

    return false;
}

export function BinaryExpression(node, parent) {
    // let i = (1 in []);
    // for ((1 in []);;);
    return node.operator === "in" && (t.isVariableDeclarator(parent) || t.isFor(parent));
}

export function SequenceExpression(node, parent) {

    if (
        // Although parentheses wouldn"t hurt around sequence
        // expressions in the head of for loops, traditional style
        // dictates that e.g. i++, j++ should not be wrapped with
        // parentheses.
        t.isForStatement(parent) ||
        t.isThrowStatement(parent) ||
        t.isReturnStatement(parent) ||
        (t.isIfStatement(parent) && parent.test === node) ||
        (t.isWhileStatement(parent) && parent.test === node) ||
        (t.isForInStatement(parent) && parent.right === node) ||
        (t.isSwitchStatement(parent) && parent.discriminant === node) ||
        (t.isExpressionStatement(parent) && parent.expression === node)
    ) {
        return false;
    }

    // Otherwise err on the side of overparenthesization, adding
    // explicit exceptions above if this proves overzealous.
    return true;
}

export function YieldExpression(node, parent) {
    return t.isBinary(parent) ||
        t.isUnaryLike(parent) ||
        t.isCallExpression(parent) ||
        t.isMemberExpression(parent) ||
        t.isNewExpression(parent) ||
        (t.isConditionalExpression(parent) && node === parent.test);

}

export {
    YieldExpression as AwaitExpression
};

export function ClassExpression(node, parent, printStack) {
    return isFirstInStatement(printStack, {
        considerDefaultExports: true
    });
}

export function UnaryLike(node, parent) {
    return t.isMemberExpression(parent, {
            object: node
        }) ||
        t.isCallExpression(parent, {
            callee: node
        }) ||
        t.isNewExpression(parent, {
            callee: node
        });
}

export function FunctionExpression(node, parent, printStack) {
    return isFirstInStatement(printStack, {
        considerDefaultExports: true
    });
}

export function ArrowFunctionExpression(node, parent) {
    if (
        // export default (function () {});
        t.isExportDeclaration(parent) ||
        t.isBinaryExpression(parent) ||
        t.isLogicalExpression(parent) ||
        t.isUnaryExpression(parent) ||
        t.isTaggedTemplateExpression(parent)
    ) {
        return true;
    }

    return UnaryLike(node, parent);
}

export function ConditionalExpression(node, parent) {
    if (
        t.isUnaryLike(parent) ||
        t.isBinary(parent) ||
        t.isConditionalExpression(parent, {
            test: node
        }) ||
        t.isAwaitExpression(parent)
    ) {
        return true;
    }

    return UnaryLike(node, parent);
}

export function AssignmentExpression(node) {
    if (t.isObjectPattern(node.left)) {
        return true;
    } else {
        return ConditionalExpression(...arguments);
    }
}

// Walk up the print stack to deterimine if our node can come first
// in statement.
function isFirstInStatement(printStack, {
    considerArrow = false,
    considerDefaultExports = false
} = {}) {
    let i = printStack.length - 1;
    let node = printStack[i];
    i--;
    let parent = printStack[i];
    while (i > 0) {
        if (
            t.isExpressionStatement(parent, {
                expression: node
            }) ||
            t.isTaggedTemplateExpression(parent) ||
            considerDefaultExports && t.isExportDefaultDeclaration(parent, {
                declaration: node
            }) ||
            considerArrow && t.isArrowFunctionExpression(parent, {
                body: node
            })
        ) {
            return true;
        }

        if (
            t.isCallExpression(parent, {
                callee: node
            }) ||
            (t.isSequenceExpression(parent) && parent.expressions[0] === node) ||
            t.isMemberExpression(parent, {
                object: node
            }) ||
            t.isConditional(parent, {
                test: node
            }) ||
            t.isBinary(parent, {
                left: node
            }) ||
            t.isAssignmentExpression(parent, {
                left: node
            })
        ) {
            node = parent;
            i--;
            parent = printStack[i];
        } else {
            return false;
        }
    }

    return false;
}
