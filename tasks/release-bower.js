/*
 * grunt-release-bower
 * https://github.com/jkorona/grunt-release-bower
 *
 * Copyright (c) 2014 Jan Korona
 * Licensed under the MIT license.
 */
module.exports = function (grunt) {
    'use strict';

    var DEFAULT_OPTIONS = require('../lib/constants').DEFAULT_OPTIONS;

    grunt.registerTask('release-bower', 'Release multiple Bower components.', function () {

        // Creating the execution context
        var ctx = require('../lib/context').create(grunt, this.options(DEFAULT_OPTIONS), this.args);

        // prepare asynchronous handling
        var done = this.async();

        function cleanup() {
            ctx.fs.delete(ctx.options.tmpDir);
        };

        var finalize = function (success) {
            try {
                cleanup()
            } catch (ex) {
                // Silent cleanup
            }
            done(success);
        };

        // Main error handler of this task
        function handleError(err) {
            finalize();
            throw err;
        }

        // Cleanup tmp folder before we start in case of any trash from last execution
        cleanup();
        // Recreate the tmp folder
        fs.mkdir(ctx.options.tmpDir);

        // Fire the release process
        ctx.execute().done(finalize, handleError);
    });
};