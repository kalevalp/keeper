'use strict';
const keeper = require('keeper');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.hello = keeper.wrapInKeeper(async event => {
    await sleep(300).then(() => console.log("Finished doing my asynchronous thing, can exit now!"))
    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: 'Hello world!',
            },
            null,
            2
        ),
    };
});
