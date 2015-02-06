var q = require('q');

function validateVersionRequirement(ctx, versions, providedVersion) {
    if (providedVersion) {
        ctx.semverUtils.assert(providedVersion);
    }

    // The one version that has to be equal, if no version was provided
    var theVersion;
    for (var key in versions) {
        if (providedVersion) {
            // If the provided version is already used -> fail
            if (versions[key].equals(ctx.semver(providedVersion))) {
                throw new Error('The provided version ' + providedVersion.toString() + ' is already used by the component \'' + key + '\'');
            }

            // If the provided version is smaller then a version that is already used -> fail
            if (versions[key].compare(ctx.semver(providedVersion)) > 0) {
                throw new Error('The provided version ' + providedVersion.toString() + ' is smaller then the version of the component \'' + key + '#' + versions[key] + '\'');
            }
        } else {
            if (!theVersion) {
                theVersion = versions[key];
            } else {
                if (!versions[key].equals(theVersion)) {
                    throw new Error('If no version is provided, then all components must have already the same version! Use --' + ctx.CMD_OPTIONS.ALL + ' and --' + ctx.CMD_OPTIONS.VERSION +
                    ' this time in order to synchronize the versions');
                }
            }
        }
    }
}

module.exports.execute = function (ctx) {
    var promises = [];

    ctx._.each(ctx.availableBowerComponents, function (component) {
        this.push(ctx.bowerUtils.determineCurrentVersion(component));

    }, promises);

    return q.all(promises).then(function (res) {
        var bcArray = ctx._.values(ctx.availableBowerComponents);
        var versions = {};
        for (var i = 0; i < bcArray.length; i++) {
            versions[bcArray[i].name] = res[i];
            ctx.debug(bcArray[i].name + ': ' + res[i]);
        }

        var providedVersion = ctx.cmdOption(ctx.CMD_OPTIONS.VERSION);

        validateVersionRequirement(ctx, versions, providedVersion);

        var chain = bcArray.reduce(function (previous, item) {
            return previous.then(ctx.releaseHelper.release(item));
        }, q.resolve());

        return chain;
    });
};