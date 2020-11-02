const ah = require('async_hooks');
const util = require('util');

const unresolvedPromises = new Set();
const out = [];

let resolveJoin = () => {};
let rejectJoin = () => {};

const promiseHook =
      ah.createHook({
          init : (id, type, triggerAsyncId, resource) => {
              out.push(util.inspect({id, type, triggerAsyncId, resource}));

              if (type === 'PROMISE' && !resource.isChainedPromise) {
                  unresolvedPromises.add(id);
              }
          },
          promiseResolve : (id) => {
              debugger;
              if (unresolvedPromises.has(id)) {
                  unresolvedPromises.delete(id);
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

        return joinPromise.then(() => {return response;});
    }
}

module.exports.wrapInKeeper = wrapInKeeper;
