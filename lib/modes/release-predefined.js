var q = require('q');

module.exports.execute = function (ctx) {
    var promises = [];

    ctx._.each(ctx.args, function (componentName) {
        if (ctx.availableBowerComponents.hasOwnProperty(componentName)) {
            this.push(ctx.releaseHelper.release(ctx.availableBowerComponents[componentName]));
        } else {
            throw new Error('Couldn\'t match component \'' + componentName + '\' with corresponding bower.json file.');
        }
    }, promises);
    return q.all(promises);
};
