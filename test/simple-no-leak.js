'use strict';

function sleepPrint(ms, message) {
    const x = new Promise(resolve => resolve(42));
    // const x = Promise.resolve(42);
    return x;
}

async function handler() {
    const x = sleepPrint(200, "sleep #1");

    await x;

    console.log("Handler done!");
}

module.exports.handler = handler;

if (require.main === module) {
    handler();
}
