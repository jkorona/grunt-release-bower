/**
 * Created by mik on 30.01.2015.
 */

var path = require('path');
var q = require('q');

module.exports = function (ctx) {

    this.release = function (bowerComponent) {
        var version = ctx.cmdOption(ctx.CMD_OPTIONS.VERSION) || bowerComponent.version,
            increment = ctx.semverUtils.verifyIncrement(ctx.cmdOption(ctx.CMD_OPTIONS.INCREMENT)),
            cwd = path.join(ctx.options.tmpDir, bowerComponent.name),
            git = ctx.gitUtils;

        ctx.logVerbose('Releasing component ' + bowerComponent.name + '...');
        return q.fcall(ctx.fs.mkdir, cwd)
            .then(git.clone(bowerComponent.url, '.', cwd))
            .then(ctx.promise(ctx.fsUtils.clean, cwd))
            .then(ctx.promise(ctx.fsUtils.cp, bowerComponent.dir, cwd))
            .then(git.exec({args: ['describe', '--tags'], cwd: cwd}))
            .then(function (result) {
                var currentVersion = ctx.semver(result.toString());
                var requestedVersion;
                if (version === 'auto') {
                    requestedVersion = currentVersion.pump(increment);
                } else {
                    requestedVersion = ctx.semver(version);
                    // if current version on the server is greater or equal to requested
                    // we have to stop execution here since we can't release component
                    // with earlier version than current one.
                    if (currentVersion.compare(requestedVersion) >= 0) {
                        throw new Error('Requested version ' + requestedVersion.toString() + ' is less than current server version (' + currentVersion.toString() + ').');
                    }
                }
                // save new version in bower component descriptor
                bowerComponent.content.version = bowerComponent.version = requestedVersion.toString();

                // use new version for internal project dependencies
                if (ctx.cmdOption(ctx.CMD_OPTIONS.ALL)){
                    for(var dependencyName in bowerComponent.content.dependencies) {
                        if (ctx.availableBowerComponents.hasOwnProperty(dependencyName)){
                            ctx.logVerbose('Updating version for dependency "' + dependencyName + '" from: ' + bowerComponent.content.dependencies[dependencyName] + ' to: ' + bowerComponent.version);
                            bowerComponent.content.dependencies[dependencyName] = bowerComponent.version;
                        }
                    }
                }

                ctx.log(ctx.grunt.template.process('Releasing <%= name %>#<%= version %> ...', {data: bowerComponent}));

                // once new version number is known, we have store modified bower.json file and finalize release
                return q.fcall(ctx.fs.write, path.join(cwd, 'bower.json'), ctx.pp(bowerComponent.content))
                    .then(git.exec({args: ['add', '--all'], cwd: cwd}))
                    .then(git.exec({
                        args: ['commit', '--allow-empty', '-m', ctx.grunt.template.process(ctx.options.commitMessage, {data: bowerComponent})],
                        cwd: cwd
                    }))
                    .then(git.exec({args: ['tag', bowerComponent.version], cwd: cwd}))
                    .then(git.exec({args: ['push', '-f', '--tags', 'origin', 'master'], cwd: cwd}));
            });
    };

    return this;
};

