'use strict';
const keeper = require('../');

function sleep(ms) {
    const x = new Promise(resolve => setTimeout(resolve, ms));
    return x;
}

async function rawMain() {
    const x = sleep(50);

//    x.then(() => sleep(500)).then(() => console.log("Slept"));

    await x;
    console.log("Main");
}

const main = keeper.wrapInKeeper(rawMain);




main();
    // .then(() => console.log("After main"))
    // .catch(() => console.log("Caught"));
