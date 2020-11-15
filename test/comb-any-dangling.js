'use strict';
const keeper = require('../');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function rawMain() {
    await Promise.any([
        sleep(10),
        sleep(50).then(() => {throw "err";}),
        sleep(500).then(() => sleep(500)).then(() => console.log("Long wait done"))
    ])
        .then(() => console.log("Slept"))
        .catch(() => console.log("Failed"));

    console.log("Main");
}

const main = keeper.wrapInKeeper(rawMain);

main();