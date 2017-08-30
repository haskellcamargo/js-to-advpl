import * as t from "babel-types";

export function _params(node) {
    this.print(node.typeParameters, node);
    this.token("(");
    this._parameters(node.params, node);
    this.token(")");

    this.print(node.returnType, node);
}

export function _parameters(parameters, parent) {
    for (let i = 0; i < parameters.length; i++) {
        this._param(parameters[i], parent);

        if (i < parameters.length - 1) {
            this.token(",");
            this.space();
        }
    }
}

export function _param(parameter, parent) {
    this.printJoin(parameter.decorators, parameter);
    this.print(parameter, parent);
    if (parameter.optional) this.token("?"); // TS / flow
    this.print(parameter.typeAnnotation, parameter); // TS / flow
}

export function _methodHead(node) {
    const kind = node.kind;
    const key = node.key;

    if (kind === "method" || kind === "init") {
        if (node.generator) {
            this.token("*");
        }
    }

    if (kind === "get" || kind === "set") {
        this.word(kind);
        this.space();
    }

    if (node.async) {
        this.word("async");
        this.space();
    }

    if (node.computed) {
        this.token("[");
        this.print(key, node);
        this.token("]");
    } else {
        this.print(key, node);
    }

    if (node.optional) {
        // TS
        this.token("?");
    }

    this._params(node);
}

export function _predicate(node) {
    if (node.predicate) {
        if (!node.returnType) {
            this.token(":");
        }
        this.space();
        this.print(node.predicate, node);
    }
}

export function _functionHead(node) {
    if (node.async) {
        this.word("async");
        this.space();
    }
    this.word("Function");
    if (node.generator) this.token("*");

    this.space();
    if (node.id) {
        this.print(node.id, node);
    }

    this._params(node);
    this._predicate(node);
}

export function FunctionExpression(node) {
    this._functionHead(node);
    this.space();
    this.print(node.body, node);
}

export {
    FunctionExpression as FunctionDeclaration
};

export function ArrowFunctionExpression(node) {
    if (node.async) {
        this.word("async");
        this.space();
    }

    const firstParam = node.params[0];

    if (
        node.params.length === 1 &&
        t.isIdentifier(firstParam) &&
        !hasTypes(node, firstParam)
    ) {
        this.print(firstParam, node);
    } else {
        this._params(node);
    }

    this._predicate(node);

    this.space();
    this.token("=>");
    this.space();

    this.print(node.body, node);
}

function hasTypes(node, param) {
    return (
        node.typeParameters ||
        node.returnType ||
        param.typeAnnotation ||
        param.optional ||
        param.trailingComments
    );
}
