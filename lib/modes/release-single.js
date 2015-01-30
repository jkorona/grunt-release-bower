var q = require('q');

module.exports.execute = function (ctx) {
    return ctx.releaseHelper.release(ctx.availableBowerComponents[0]);
};
