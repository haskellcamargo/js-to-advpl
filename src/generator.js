import detectIndent from "detect-indent";
import SourceMap from "./source-map";
import * as messages from "babel-messages";
import Printer from "./printer";

class Generator extends Printer {
    constructor(ast, opts = {}, code) {
        const tokens = ast.tokens || [];
        const format = normalizeOptions(code, opts, tokens);
        const map = opts.sourceMaps ? new SourceMap(opts, code) : null;
        super(format, map, tokens);

        this.ast = ast;
    }

    generate() {
        return super.generate(this.ast);
    }
}

function normalizeOptions(code, opts, tokens) {
    let style = "  ";
    if (code && typeof code === "string") {
        const indent = detectIndent(code).indent;
        if (indent && indent !== " ") style = indent;
    }

    const format = {
        auxiliaryCommentBefore: opts.auxiliaryCommentBefore,
        auxiliaryCommentAfter: opts.auxiliaryCommentAfter,
        shouldPrintComment: opts.shouldPrintComment,
        retainLines: opts.retainLines,
        retainFunctionParens: opts.retainFunctionParens,
        comments: opts.comments == null || opts.comments,
        compact: opts.compact,
        minified: opts.minified,
        concise: opts.concise,
        quotes: opts.quotes || findCommonStringDelimiter(code, tokens),
        jsonCompatibleStrings: opts.jsonCompatibleStrings,
        indent: {
            adjustMultilineComment: true,
            style: style,
            base: 0
        },
        flowCommaSeparator: opts.flowCommaSeparator,
    };

    if (format.minified) {
        format.compact = true;

        format.shouldPrintComment = format.shouldPrintComment || (() => format.comments);
    } else {
        format.shouldPrintComment = format.shouldPrintComment || ((value) => format.comments ||
            (value.indexOf("@license") >= 0 || value.indexOf("@preserve") >= 0));
    }

    if (format.compact === "auto") {
        format.compact = code.length > 500000; // 500KB

        if (format.compact) {
            console.error("[BABEL] " + messages.get("codeGeneratorDeopt", opts.filename, "500KB"));
        }
    }

    if (format.compact) {
        format.indent.adjustMultilineComment = false;
    }

    return format;
}

function findCommonStringDelimiter(code, tokens) {
    const DEFAULT_STRING_DELIMITER = "double";
    if (!code) {
        return DEFAULT_STRING_DELIMITER;
    }

    const occurrences = {
        single: 0,
        double: 0
    };

    let checked = 0;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type.label !== "string") continue;

        const raw = code.slice(token.start, token.end);
        if (raw[0] === "'") {
            occurrences.single++;
        } else {
            occurrences.double++;
        }

        checked++;
        if (checked >= 3) break;
    }
    if (occurrences.single > occurrences.double) {
        return "single";
    } else {
        return "double";
    }
}

export class CodeGenerator {
    constructor(ast, opts, code) {
        this._generator = new Generator(ast, opts, code);
    }
    generate() {
        return this._generator.generate();
    }
}

export default function (ast, opts, code) {
    const gen = new Generator(ast, opts, code);
    return gen.generate();
}
