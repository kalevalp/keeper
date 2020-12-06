/ * *****************************************************
  *   async functions
  * *************************************************** */

// safe 1
async function asyncFuntion() {
    const x = libraryAsyncFunction();
    return x;
}

// safe 2
async function asyncFuntion() {
    const x = await libraryAsyncFunction();
    return 42;
}

// unsafe
async function asyncFuntion() {
    const x = libraryAsyncFunction();
    return 42;
}

/ * *****************************************************
  *   built-in promise creating libraries
  *     possible approach - implement mocks for all libraries
  * *************************************************** */

const fs = require('fs/promises');


// safe
function foo() {
    const fsp = fs.readFile('comb-all.js');
    return fsp.then(() => 42);
}

// unsafe
function foo() {
    const fsp = fs.readFile('comb-all.js');
    return 42;
}


/ * *****************************************************
  *   libraries using external promise libraries
  *     e.g., bluebird
  *     possible approach - implement mocks for all promise libraries
  * *************************************************** */


/ * *****************************************************
  *   non-standard ways of creating and returning promises
  *     ???
  * *************************************************** */


/ * *****************************************************
  *   indirectly related promises in combinators
  * *************************************************** */

function foo() {
    Promise.all([
        () => {
            return promiseProducingCall().then(() => 42);
        }(),
        () => {
            const x = promiseProducingCall();
            return x.then(() => 42);
        }(),
        () => {
            const x = rejectingPromiseProducingCall(); // This one fails and crashes the combinator
            return x.then(() => 42);
        }(),
        () => {
            const x = promiseProducingCall();
            return Promise.resolve(42);
        }(),
    ]);
}

function foo() {
    Promise.any([
        () => {
            return promiseProducingCall().then(() => 42);
        }(),
        () => {
            const x = promiseProducingCall();
            return x.then(() => 42);
        }(),
        () => {
            const x = promiseProducingCall();
            return Promise.resolve(42);
        }(),
    ]);
}
