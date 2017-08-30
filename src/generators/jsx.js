export function JSXAttribute(node) {
    this.print(node.name, node);
    if (node.value) {
        this.token("=");
        this.print(node.value, node);
    }
}

export function JSXIdentifier(node) {
    this.word(node.name);
}

export function JSXNamespacedName(node) {
    this.print(node.namespace, node);
    this.token(":");
    this.print(node.name, node);
}

export function JSXMemberExpression(node) {
    this.print(node.object, node);
    this.token(".");
    this.print(node.property, node);
}

export function JSXSpreadAttribute(node) {
    this.token("{");
    this.token("...");
    this.print(node.argument, node);
    this.token("}");
}

export function JSXExpressionContainer(node) {
    this.token("{");
    this.print(node.expression, node);
    this.token("}");
}

export function JSXSpreadChild(node) {
    this.token("{");
    this.token("...");
    this.print(node.expression, node);
    this.token("}");
}

export function JSXText(node) {
    const raw = this.getPossibleRaw(node);

    if (raw != null) {
        this.token(raw);
    } else {
        this.token(node.value);
    }
}

export function JSXElement(node) {
    const open = node.openingElement;
    this.print(open, node);
    if (open.selfClosing) return;

    this.indent();
    for (const child of node.children) {
        this.print(child, node);
    }
    this.dedent();

    this.print(node.closingElement, node);
}

function spaceSeparator() {
    this.space();
}

export function JSXOpeningElement(node) {
    this.token("<");
    this.print(node.name, node);
    if (node.attributes.length > 0) {
        this.space();
        this.printJoin(node.attributes, node, {
            separator: spaceSeparator
        });
    }
    if (node.selfClosing) {
        this.space();
        this.token("/>");
    } else {
        this.token(">");
    }
}

export function JSXClosingElement(node) {
    this.token("</");
    this.print(node.name, node);
    this.token(">");
}

export function JSXEmptyExpression() {}
