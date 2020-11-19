'use strict';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function handler() {
    await Promise.race([sleep(10).then(() => console.log("Short wait done")),
                        sleep(50).then(() => {throw "err";}),
                        sleep(500).then(() => console.log("Long wait done"))])
        .then(() => console.log("Slept")).catch(() => console.log("Failed"));

    console.log("Main");
}

module.exports.handler = handler;
