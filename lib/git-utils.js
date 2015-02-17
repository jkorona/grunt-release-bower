var q = require('q');

var clonedRepositories = [];
var queue = q.when();

module.exports = function (ctx) {

    this.clone = function (url, path, cwd) {
        if (clonedRepositories.indexOf(url) > -1) {
            ctx.debug('Skipping already cloned repository: ' + url);
            return q.when();
        }
        clonedRepositories.push(url);
        return this.exec({args: ['clone', url, path], cwd: cwd});
    };

    this.exec = function (opts) {
        ctx.debug('running: git ' + opts.args.join(' '));
        return function () {

            var exe = function () {
                var deferred = q.defer();

                ctx.grunt.util.spawn({
                    cmd: 'git',
                    args: opts.args,
                    opts: {cwd: opts.cwd}
                }, function (error, output) {
                    if (error) {
                        var message = 'Error while running git command \'' +
                            'git ' + opts.args.join(' ') + '\' in directory \'' + opts.cwd + '\'. ' +
                            'Problem was caused by: ' + error.message;
                        deferred.reject(new Error(message));
                    } else {
                        deferred.resolve(output);
                    }
                });

                return deferred.promise;
            };

            return queue = queue.then(exe);
        };
    };

    return this;
};
