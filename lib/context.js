var q = require('q');

var EXECUTION_MODES = require('./constants').EXECUTION_MODES;
var CMD_OPTIONS = require('./constants').CMD_OPTIONS;

var Context = function (grunt, options, args) {
    var that = this;

    // == UTILS ==
    that.releaseHelper = require('./release-helper')(that);
    that.bowerUtils = require('./bower-utils')(that);
    that.semverUtils = require('./semver-utils');
    that.gitUtils = require('./git-utils')(that);
    that.fsUtils = require('./fs-utils')(that);
    that.grunt = grunt;
    that.fs = grunt.file;
    that._ = grunt.util._;

    that.EXECUTION_MODES = EXECUTION_MODES;
    that.CMD_OPTIONS = CMD_OPTIONS;

    // == STATE ==
    that.args = args;
    that.options = options;
    that.executionMode = undefined;

    that.debug = grunt.log.debug;
    that.log = grunt.log.writeln;
    that.logVerbose = grunt.verbose.writeln;

    that.execute = function() {
        return require('./modes/' + that.executionMode).execute(that);
    };

    that.promise = function () {
        var args = grunt.util.toArray(arguments);
        return function () {
            return q.fcall.apply(this, args);
        };
    };

    that.semver = function (versionString) {
        return that.semverUtils.create(versionString);
    };

    that.cmdOption = function (argument) {
        return grunt.option(argument);
    }

    /**
     * Simple pretty print function which converts given JavaScript object to the
     * JSON string with human readable indentations.
     *
     * Used to produce bower.json files.
     *
     * This function can be replaced by some already existing library, but I didn't find
     * anything lightweight enough by now.
     *
     * @param object a JavaScript object with content to print.
     * @returns {string} formatted JSON string.
     */
    that.pp = function (object) {
        var ind = 0;
        var json = JSON.stringify(object);
        var result = '';
        for (var i = 0; i < json.length; i++) {
            var letter = json[i];
            switch (letter) {
                /* jshint indent: false */
                case '{':
                /* falls through */
                case '[':
                    result += letter + '\n';
                    ind++;
                    result += grunt.util.repeat(ind, '\t');
                    break;
                case '}':
                /* falls through */
                case ']':
                    ind--;
                    result += '\n' + grunt.util.repeat(ind, '\t') + letter;
                    break;
                case ',':
                    result += letter + '\n';
                    result += grunt.util.repeat(ind, '\t');
                    break;
                default:
                    result += letter;
            }
        }
        return result;
    };

    // ==== INTERNALS =================================
    var validateUserOptions = function () {
        if (!that._.isEmpty(args) && that.cmdOption(CMD_OPTIONS.ALL)) {
            throw new Error('It\'s not support to specify the components when using the \'' + that.CMD_OPTIONS.ALL + '\'.');
        }
    };

    var findBowerComponents = function () {
        // scan given path in search for bower json files
        var bowerFiles = that.fs.expand({cwd: that.options.scanPath, matchBase: true}, 'bower.json');
        if (that._.isEmpty(bowerFiles)) {
            throw new Error('Did not find any bower.json file in scan path \'' + that.options.scanPath + '\'.');
        } else {
            return that.bowerUtils.readBowerFiles(that.options.scanPath, bowerFiles);
        }
    };

    var determineExecutionMode = function () {
        if (!that._.isEmpty(args)) {
            return EXECUTION_MODES.RELEASE_PREDEFINED;
        } else if (that.availableBowerComponents.length === 1) {
            return EXECUTION_MODES.RELEASE_SINGLE_MODULE;
        } else if (that.cmdOption(CMD_OPTIONS.ALL)) {
            return EXECUTION_MODES.RELEASE_ALL;
        } else {
            return EXECUTION_MODES.RELEASE_INTERACTIVE;
        }
    };

    validateUserOptions();

    that.availableBowerComponents = findBowerComponents();
    that.executionMode = determineExecutionMode();
};

module.exports.create = function (grunt, options, args) {
    return new Context(grunt, options, args);
};