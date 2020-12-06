const keeper = require('../');

const tests = [
    'simple-fspromise-no-leak.js',
    // 'simple-async-no-leak.js',
    // 'simple-no-leak.js',
    // 'simple-leak.js',
    /* 'comb-all.js',
     * 'comb-any-dangling.js',
     * 'comb-race.js',
     * 'promise.js' */];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    for (const test of tests) {
        console.log("************************************************")
        console.log("** Running test: ", test);

        handler = keeper.createKeeperHandler(test,'handler', true);

        await handler();

        console.log("** handler done!");

        await sleep(500);

        console.log("************************************************")

    }
}

main();
