/**
 * Created by mik on 30.01.2015.
 */

// a default options for release task
module.exports.DEFAULT_OPTIONS = {
    // this option indicates root folder that should be used for components scanning.
    scanPath: 'dist',
    // this option specified name of the temporary directory used by task to get bower component
    tmpDir: 'tmp',
    // default message used to commit git changes
    commitMessage: 'Release <%= name %>, version <%= version %>.'
};

module.exports.CMD_OPTIONS = {
    ALL: 'all',
    VERSION: 'ver',
    INCREMENT: 'increment'
};

// The constant value has to fit with the file name in modes
module.exports.EXECUTION_MODES = {
    RELEASE_ALL: 'release-all',                     // Will release all modules
    RELEASE_PREDEFINED: 'release-predefined',       // Will release the modules that are specified as argument
    RELEASE_INTERACTIVE: 'release-interactive',     // Will ask the user to choose which modules should be released
    RELEASE_SINGLE_MODULE: 'release-single'         // Will automatically release, because only one module is present
};