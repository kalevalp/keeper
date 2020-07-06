const ah = require('async_hooks');

const unresolvedPromises = new Set();

const promiseHook =
      ah.createHook({
          init : (id, type) => {
              if (type === 'PROMISE') {
                  unresolvedPromises.add(id);
              }
          },
          promiseResolve : (id) => {
              if (unresolvedPromises.has(id)) {
                  unresolvedPromises.delete(id);
              } else {
                  // KALEV - I do not expect this to ever happen, but you never know :shrug:
                  console.log("Unexpected error - promise resolution of a promise that was not previously created.");
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

        if (checkUnresolvedPromises()) {
            console.log("Unresolved promises exist!");
        }

        return response;
    }
}

module.exports.wrapInKeeper = wrapInKeeper;
