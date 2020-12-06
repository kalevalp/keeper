'use strict';

const fs = require('fs/promises');

async function foo() {
    const fsp = fs.readFile('comb-all.js');
    const x = await fsp;
    return x;
}

async function handler() {
    const x = foo();

    const fooData = await x;

    console.log(fooData.toString());
}

module.exports.handler = handler;

if (require.main === module) {
    handler();
}
