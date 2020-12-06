'use strict';

async function foo() {
    return 42;
}

async function handler() {
    const x = foo();

    console.log(x);

    await x;

    console.log("Handler done!");
}

module.exports.handler = handler;

if (require.main === module) {
    handler();
}
