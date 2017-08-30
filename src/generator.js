
class Generator {
    constructor(ast, opts = {}, code) {
    }
}

export default function (ast, opts, code) {
    console.log(ast);
    const gen = new Generator(ast, opts, code);
    return gen.generate();
}
