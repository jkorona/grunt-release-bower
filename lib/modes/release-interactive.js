var inquirer = require('inquirer');
var q = require('q');

module.exports.execute = function (ctx) {
    var deferred = q.defer();
    inquirer.prompt([
        {
            type: 'checkbox',
            name: 'components',
            message: 'Choose which components you want to release',
            choices: ctx._.keys(ctx.availableBowerComponents)
        }
    ], function (answers) {
        var promises = [];
        ctx._.each(answers.components, function (componentName) {
            if (ctx.availableBowerComponents.hasOwnProperty(componentName)) {
                this.push(ctx.releaseHelper.release(ctx.availableBowerComponents[componentName]));
            } else {
                throw new Error('Couldn\'t match component \'' + componentName + '\' with corresponding bower.json file.');
            }
        }, promises);
        return q.all(promises);
    });
    return deferred.promise;
};
