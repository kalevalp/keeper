'use strict';

function sleep(ms) {
    const x = new Promise(resolve => setTimeout(resolve, ms));
    return x;
}

async function handler() {
    const x = sleep(50);

//    x.then(() => sleep(500)).then(() => console.log("Slept"));

    await x;
    console.log("Main");
}

module.exports.handler = handler;
