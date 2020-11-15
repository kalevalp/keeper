const ah = require('async_hooks');
const util = require('util');
const {NodeVM,VMScript} = require("vm2");


const unresolvedPromises = {};
const out = [];
const stacks = [];

let resolveJoin = () => {};
let rejectJoin = () => {};

const promiseHook =
      ah.createHook({
          init : (id, type, triggerAsyncId, resource) => {
              out.push(util.inspect({id, type, triggerAsyncId, resource}));
              stacks.push((new Error()).stack);

              if (type === 'PROMISE' && !resource.isChainedPromise) {
                  unresolvedPromises[id] = (new Error()).stack;
              }
          },
          promiseResolve : (id) => {
              debugger;
              if (unresolvedPromises[id]) {
                  delete unresolvedPromises[id];
              }
              if (!checkUnresolvedPromises()) {
                  debugger;
                  resolveJoin();
              }
          },
      });

promiseHook.enable();

function checkUnresolvedPromises() {
    return unresolvedPromises.size !== 0;
}

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
                             runLocally,
                             updateContext) {

    const originalLambdaPath    = `${runLocally?'':'/var/task/'}${originalLambdaFile}`;
    const originalLambdaCode    = fs.readFileSync(originalLambdaFile, 'utf8');
    const originalLambdaScript  = new VMScript(originalLambdaCode);

    const promiseForest = {};

    const promiseWrapper = function (...params) {
        const result = new Promise(...params);

        promiseForest[result] = {};

        result.shadow_catch = result.catch;
        result.shadow_finally = result.finally;
        result.shadow_then = result.then;

        result.catch = function (...params) {
            const catchPromise = result.shadow_catch(...params);
            // Handle a call that returns a promise

            if (promiseForest[this]) {
                delete promiseForest[this];
            }
            promiseForest[catchPromise] = {};

            return catchPromise;
        };
        result.finally = function (...params) {
            const finallyPromise = result.shadow_finally(...params);
            // Handle a call that returns a promise

            if (promiseForest[this]) {
                delete promiseForest[this];
            }
            promiseForest[finallyPromise] = {};

            return finallyPromise;
        };
        result.then = function (...params) {
            const thenPromise = result.shadow_then(...params);
            // Handle a call that returns a promise

            if (promiseForest[this]) {
                delete promiseForest[this];
            }
            promiseForest[thenPromise] = {};

            return thenPromise;
        };

        return result;
    }

    promiseWrapper.all = (...params) => {

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
        }
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

}





module.exports.wrapInKeeper = wrapInKeeper;
