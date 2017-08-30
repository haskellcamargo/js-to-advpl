var a = true;
var b = 1;
var c = 'foo';
var d = null;
var eita = [1, 2, 3];
var obj = { name: 'celo', age: 20 };

function fact(n) {
    if (n === 0) {
        return 1;
    }

    return n * fact(n - 1);
}