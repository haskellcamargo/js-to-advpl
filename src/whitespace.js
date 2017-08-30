export default class Whitespace {
    constructor(tokens) {
        this.tokens = tokens;
        this.used = {};
    }

    getNewlinesBefore(node) {
        let startToken;
        let endToken;
        const { tokens } = this;

        let index = this._findToken((token) => token.start - node.start, 0, tokens.length);
        if (index >= 0) {
            while (index && node.start === tokens[index - 1].start) --index;
            startToken = tokens[index - 1];
            endToken = tokens[index];
        }

        return this._getNewlinesBetween(startToken, endToken);
      }
}
