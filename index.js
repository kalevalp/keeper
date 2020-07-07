const ah = require('async_hooks');
const util = require('util');

const unresolvedPromises = new Set();

const promiseHook =
      ah.createHook({
          init : (id, type, triggerAsyncId, resource) => {
              if (type === 'PROMISE' && !resource.isChainedPromise) {
                  unresolvedPromises.add(id);
              }
          },
          promiseResolve : (id) => {
              if (unresolvedPromises.has(id)) {
                  unresolvedPromises.delete(id);
              }
          },
      });

function checkUnresolvedPromises() {
    return unresolvedPromises.size !== 0;
}

function wrapInKeeper(handler) {
    return async (event, process) => {
        promiseHook.enable();

        const response = await handler(event, process);
        promiseHook.disable();

        if (checkUnresolvedPromises()) {
            console.log("Unresolved promises exist!");
        }

        return response;
    }
}

module.exports.wrapInKeeper = wrapInKeeper;
