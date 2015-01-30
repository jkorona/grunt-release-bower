/**
 * Semver class represents component version defined in the {@link http://semver.org/ Semantic Versioning convention}.
 *
 * @param string a string with version in correct semver format MAJOR.MINOR.PATCH.
 * @constructor
 */
function Semver(string) {
    Semver.assert(string);
    var parts = string.split('.');
    this.major = parseInt(parts[0], 10);
    this.minor = parseInt(parts[1], 10);
    this.patch = parseInt(parts[2], 10);
}

Semver.prototype = {
    /**
     * Increases version number using increment factor.
     *
     * @param increment indicates which part of version should be pumped (major, minor, patch).
     * @returns {*} current Semver instance for method chaining.
     */
    pump: function (increment) {
        increment = increment || Semver.PATCH; // default is patch
        switch (increment) {
            /* jshint indent: false */
            case Semver.MAJOR:
                this.major++;
                this.minor = this.patch = 0;
                break;
            case Semver.MINOR:
                this.minor++;
                this.patch = 0;
                break;
            case Semver.PATCH:
                this.patch++;
                break;
        }
        return this;
    },
    /**
     * Returns array representation of Semver object.
     * @returns {Array} array with three elements corresponding to veresion parts: [MAJOR, MINOR, PATCH].
     */
    toArray: function () {
        return [
            this.major,
            this.minor,
            this.patch
        ];
    },
    /**
     * Returns string representation of the Semver object.
     * @returns {string}
     */
    toString: function () {
        return this.toArray().join('.');
    },
    compare: function (semver) {
        function compInt(intValueA, intValueB) {
            function b2i(b) {
                return b ? 1 : 0;
            }

            return b2i(intValueA > intValueB) - b2i(intValueA < intValueB);
        }

        for (var i = 0; i < 3; i++) {
            var partResult = compInt(this.toArray()[i], semver.toArray()[i]);
            if (partResult) {
                return partResult;
            }
        }
        return 0;
    },
    equals: function (semver) {
        return this.compare(semver) === 0;
    }
};

// possible values for the 'increment' flag. Default is 'patch'.
Semver.MAJOR = 'major';
Semver.MINOR = 'minor';
Semver.PATCH = 'patch';
Semver.INCREMENTS = [
    Semver.MAJOR,
    Semver.MINOR,
    Semver.PATCH
];

Semver.verifyIncrement = function (value) {
    value = value || 'patch';
    if (Semver.INCREMENTS.indexOf(value) == -1) {
        throw new Error('Given value \'' + value + '\' does not match any possible option for --increment flag. ' +
        'Possible values are \'major\', \'minor\', \'patch\'');
    }
    return value;
};

/**
 * Static method that evaluates given string for correctness with semver convention for versioninig:
 * MAJOR.MINOR.PATCH
 *
 * @param versionString a string to evaluate.
 */
Semver.assert = function (versionString) {
    if (!(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(versionString))) {
        throw new Error('Given version string \'' + versionString + '\' does not match Semver specification.');
    }
};

module.exports.assert = Semver.assert;
module.exports.verifyIncrement = Semver.verifyIncrement;

/**
 * Factory method that creates new instance of Semver class for given string.
 *
 * @param versionString a string with version number for which Semver instance should be created.
 * @returns {module.Semver} a newly created Semver instance.
 */
module.exports.create = function (versionString) {
    return new Semver(versionString);
};