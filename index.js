const util = require('util');
const {NodeVM,VMScript} = require("vm2");
const fs = require('fs');

const unresolvedPromises = {};
const out = [];
const stacks = [];

let resolveJoin = () => {};
let rejectJoin = () => {};

function wrapInKeeper(handler) {
    return async (event, process) => {


        const response = await handler(event, process);

        let joinPromise;

        if (checkUnresolvedPromises()) {
            console.log("Unresolved promises exist!: ", unresolvedPromises);

            joinPromise = new Promise((resolve, reject) => {
                debugger;
                resolveJoin = resolve;
                rejectJoin = reject;
            });
        } else {
            joinPromise = Promise.resolve(true);
        }

        console.log(out);
        console.log(stacks);

        return joinPromise.then(() => {return response;});
    }
}

function createKeeperHandler(originalLambdaFile,
                             originalLambdaHandler,
                             runLocally) {

    const originalLambdaPath    = `${runLocally?'':'/var/task/'}${originalLambdaFile}`;
    const originalLambdaCode    = fs.readFileSync(originalLambdaFile, 'utf8');
    const originalLambdaScript  = new VMScript(originalLambdaCode);

    const promiseStackTrace = [];

    const unresolved = new Set();

    const promiseWrapper = function (baseOperation) {

        let resultClosure;
        let resolved;

        const opertaion = function (baseResolve, baseReject) {

            const resolve = function (...params) {
                console.log("## Resolving promise via resolve in constructor", util.inspect(params),"##");
                resolved = true;
                debugger;
                if (unresolved.has(resultClosure)) {
                    console.log("## Removing from unresolved via resolve in constructor ##");
                    unresolved.delete(resultClosure);
                }
                return baseResolve(...params);
            }
            const reject = function (...params) {
                console.log("## Resolving promise via reject in constructor ##");
                resolved = true;
                if (unresolved.has(resultClosure)) {
                    console.log("## Removing from unresolved via reject in constructor ##");
                    unresolved.delete(resultClosure);
                }
                return baseReject(...params);
            }

            return baseOperation(resolve, reject);
        }


        console.log("!! New promiseWrapper !!");
        resultClosure = new Promise(opertaion);

        const result = resultClosure;

        if (resolved) {
            console.log("## Already resolved, not adding to unresolved ##");
        } else {
            console.log("## Adding to unresolved via constructor ##");
            unresolved.add(result);
            promiseStackTrace.push({pr: result, stackTrace: (new Error()).stack});
        }
        result.shadow_catch = result.catch;
        result.shadow_finally = result.finally;
        result.shadow_then = result.then;

        result.catch = function (...params) {
            debugger;
            const catchPromise = result.shadow_catch(...params);
            // Handle a call that returns a promise
            console.log("!! New catch clause !!");

            // if (unresolved[this]) {
            //     console.log("## Removing from unresolved ##");
            //     delete unresolved[this];
            // }
            console.log("## Adding to unresolved ##");
            unresolved.add(catchPromise);

            return new promiseWrapper(resolve => resolve(catchPromise));
        };
        result.finally = function (...params) {
            debugger;
            const finallyPromise = result.shadow_finally(...params);
            // Handle a call that returns a promise
            console.log("!! New finally clause !!")

            // if (unresolved[this]) {
            //     console.log("## Removing from unresolved ##");
            //     delete unresolved[this];
            // }
            console.log("## Adding to unresolved ##");
            unresolved.add(finallyPromise);

            return new promiseWrapper(resolve => resolve(finallyPromise));
        };
        result.then = function (...params) {
            debugger;
            const thenPromise = result.shadow_then(...params);
            // Handle a call that returns a promise
            console.log("!! New then clause !!")

            // if (unresolved[this]) {
            //     console.log("## Removing to unresolved ##");
            //     delete unresolved[this];
            // }
            console.log("## Adding to unresolved ##");
            unresolved.add(thenPromise);

            return new promiseWrapper(resolve => resolve(thenPromise));
        };

        return result;
    }

    promiseWrapper.all = function (...params) {
        console.log("!! New Promise.all clause !!")
        const result = Promise.all(...params);
        return new promiseWrapper(resolve => resolve(result));
    }
    promiseWrapper.allSettled = (...params) => {}
    promiseWrapper.any = (...params) => {}
    promiseWrapper.race = (...params) => {}
    promiseWrapper.reject = (...params) => {}
    promiseWrapper.resolve = (...params) => {}


    const sandbox = {
        process: process,
        JSON: {
            parse: JSON.parse,
            stringify: JSON.stringify,
        },
        Promise: promiseWrapper
    }

    let executionEnv = {
        console: 'inherit',
        sandbox,
        require: {
            context: 'sandbox',
            external: true,
            builtin: ['*'],
        },
    };

    const vm = new NodeVM(executionEnv);

    const vmExports = vm.run(originalLambdaScript, originalLambdaPath);

    return async (...params) => {
        console.log("%% Starting handler run");
        const result = await vmExports[originalLambdaHandler](...params);
        console.log("%% Finished handler run");

        console.log("%% unresolved promises:", unresolved);
        console.log("%% unresolved promises with stacks:", promiseStackTrace.map(pair => unresolved.has(pair.pr)));
        console.log("%% promise stack traces:", promiseStackTrace);
        // console.log(Object.keys(unresolved)[0].then);

        // const x = {};
        // const y = Promise.resolve(42);
        // x[y] = {};
        // console.log(y.then);
        // console.log(Object.keys(x)[0].then);

        for (p of unresolved) {
            try {
                await p;
            } catch {}
        }

        console.log("%% Finished awaiting outstanding promises");

        // const tail = await Promise.all(unresolved);

        // console.log(tail);


        return result;
    };

}

module.exports.wrapInKeeper = wrapInKeeper;
module.exports.createKeeperHandler = createKeeperHandler;
