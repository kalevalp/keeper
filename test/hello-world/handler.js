'use strict';
const keeper = require('keeper');

module.exports.hello = keeper.wrapInKeeper(async event => {
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
