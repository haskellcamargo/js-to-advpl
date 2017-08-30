import map from "lodash/map";
import * as t from "babel-types";

function crawl(node, state = {}) {
    if (t.isMemberExpression(node)) {
        crawl(node.object, state);
        if (node.computed) crawl(node.property, state);
    } else if (t.isBinary(node) || t.isAssignmentExpression(node)) {
        crawl(node.left, state);
        crawl(node.right, state);
    } else if (t.isCallExpression(node)) {
        state.hasCall = true;
        crawl(node.callee, state);
    } else if (t.isFunction(node)) {
        state.hasFunction = true;
    } else if (t.isIdentifier(node)) {
        state.hasHelper = state.hasHelper || isHelper(node.callee);
    }

    return state;
}

function isHelper(node) {
    if (t.isMemberExpression(node)) {
        return isHelper(node.object) || isHelper(node.property);
    } else if (t.isIdentifier(node)) {
        return node.name === "require" || node.name[0] === "_";
    } else if (t.isCallExpression(node)) {
        return isHelper(node.callee);
    } else if (t.isBinary(node) || t.isAssignmentExpression(node)) {
        return (t.isIdentifier(node.left) && isHelper(node.left)) || isHelper(node.right);
    } else {
        return false;
    }
}

function isType(node) {
    return t.isLiteral(node) || t.isObjectExpression(node) || t.isArrayExpression(node) ||
        t.isIdentifier(node) || t.isMemberExpression(node);
}

exports.nodes = {
    AssignmentExpression(node) {
        const state = crawl(node.right);
        if ((state.hasCall && state.hasHelper) || state.hasFunction) {
            return {
                before: state.hasFunction,
                after: true
            };
        }
    },

    SwitchCase(node, parent) {
        return {
            before: node.consequent.length || parent.cases[0] === node
        };
    },

    LogicalExpression(node) {
        if (t.isFunction(node.left) || t.isFunction(node.right)) {
            return {
                after: true
            };
        }
    },

    Literal(node) {
        if (node.value === "use strict") {
            return {
                after: true
            };
        }
    },

    CallExpression(node) {
        if (t.isFunction(node.callee) || isHelper(node)) {
            return {
                before: true,
                after: true
            };
        }
    },

    VariableDeclaration(node) {
        for (let i = 0; i < node.declarations.length; i++) {
            const declar = node.declarations[i];

            let enabled = isHelper(declar.id) && !isType(declar.init);
            if (!enabled) {
                const state = crawl(declar.init);
                enabled = (isHelper(declar.init) && state.hasCall) || state.hasFunction;
            }

            if (enabled) {
                return {
                    before: true,
                    after: true
                };
            }
        }
    },

    IfStatement(node) {
        if (t.isBlockStatement(node.consequent)) {
            return {
                before: true,
                after: true
            };
        }
    }
};

exports.nodes.ObjectProperty =
    exports.nodes.ObjectTypeProperty =
    exports.nodes.ObjectMethod =
    exports.nodes.SpreadProperty = function (node, parent) {
        if (parent.properties[0] === node) {
            return {
                before: true
            };
        }
    };

exports.list = {
    VariableDeclaration(node) {
        return map(node.declarations, "init");
    },


    ArrayExpression(node) {
        return node.elements;
    },

    ObjectExpression(node) {
        return node.properties;
    }
};

[
    ["Function", true],
    ["Class", true],
    ["Loop", true],
    ["LabeledStatement", true],
    ["SwitchStatement", true],
    ["TryStatement", true]
].forEach(function ([type, amounts]) {
    if (typeof amounts === "boolean") {
        amounts = {
            after: amounts,
            before: amounts
        };
    }
    [type].concat(t.FLIPPED_ALIAS_KEYS[type] || []).forEach(function (type) {
        exports.nodes[type] = function () {
            return amounts;
        };
    });
});
