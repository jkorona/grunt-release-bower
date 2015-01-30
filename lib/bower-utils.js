var path = require('path');
var q = require('q');

module.exports = function (ctx) {

    this.readBowerFiles = function (root, paths) {
        var bowerFiles = {};
        ctx._.each(paths, function (bowerFilePath) {
            bowerFilePath = path.join(root, bowerFilePath);
            var bowerFile = ctx.fs.readJSON(bowerFilePath);
            if (bowerFile) {
                this[bowerFile.name] = {
                    name: bowerFile.name,
                    content: bowerFile,
                    version: bowerFile.version,
                    dir: path.dirname(bowerFilePath),
                    url: bowerFile.repository.url
                };
            } else {
                throw new Error('File ' + bowerFilePath + ' can\'t be read or is empty.');
            }
        }, bowerFiles);
        return bowerFiles;
    };

    this.determineCurrentVersion = function (bowerComponent) {
        var cwd = path.join(ctx.options.tmpDir, bowerComponent.name),
            git = ctx.gitUtils;

        return q.fcall(ctx.fs.mkdir, cwd)
            .then(git.clone(bowerComponent.url, '.', cwd))
            .then(git.exec({args: ['describe', '--tags'], cwd: cwd}))
            .then(function (result) {
                return ctx.semver(result.toString());
            });
    };

    return this;
};