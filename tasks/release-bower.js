/*
 * grunt-release-bower
 * https://github.com/jkorona/grunt-release-bower
 *
 * Copyright (c) 2014 Jan Korona
 * Licensed under the MIT license.
 */
module.exports = function (grunt) {
  'use strict';

  var path = require('path');
  var inquirer = require('inquirer');
  var q = require('q');

  // a default options for release task
  var DEFAULT_OPTIONS = {
    // this option indicates root folder that should be used for components scanning.
    scanPath: 'dist',
    // this option specified name of the temporary directory used by task to get bower component
    tmpDir: 'tmp',
    // default message used to commit git changes
    commitMessage: 'Release <%= name %>, version <%= version %>.'
  };

  // import lo-dash
  var _ = grunt.util._;
  var fs = grunt.file;

  grunt.registerTask('release-bower', 'Release multiple Bower components.', function () {
    var options = this.options(DEFAULT_OPTIONS);
    var components = this.args;
    var bowerComponents;

    // scan given path in search for bower json files
    var bowerFiles = fs.expand({cwd: options.scanPath, matchBase: true}, 'bower.json');
    if (_.isEmpty(bowerFiles)) {
      grunt.fatal('Did not find any bower.json file in scan path \'' + options.scanPath + '\'.');
    } else {
      grunt.log.debug(grunt.log.wordlist(bowerFiles));
      bowerComponents = readBowerFiles(options.scanPath, bowerFiles);
    }

    // prepare asynchronous handling
    var done = this.async();

    var finalize = function (success) {
      fs.delete(options.tmpDir);
      done(success);
    };

    // create temp directory for task workspace
    fs.mkdir(options.tmpDir);

    function releaseAll(componentNames) {
      var promises = [];

      _.each(componentNames, function (componentName) {
        // match component with bower file
        if (bowerComponents.hasOwnProperty(componentName)) {
          this.push(release(bowerComponents[componentName]));
        } else {
          grunt.fatal('Couldn\'t match component \'' + componentName + '\' with corresponding bower.json file.');
        }
      }, promises);
      return q.all(promises);
    }

    function release(bowerComponent) {
      var version = grunt.option('version') || bowerComponent.version,
          increment = Semver.verifyIncrement(grunt.option('increment')),
          cwd = path.join(options.tmpDir, bowerComponent.name),
          git = gitRunner(cwd);

      grunt.verbose.writeln('Releasing component ' + bowerComponent.name + '...');

      return q.fcall(fs.mkdir, cwd)
          .then(git('clone', bowerComponent.url, '.'))
          .then(promise(clean, cwd))
          .then(promise(cp, bowerComponent.dir, cwd))
          .then(git('describe', '--tags'))
          .then(function (result) {
            var currentVersion = semver(result.toString());
            var requestedVersion;
            if (version === 'auto') {
              requestedVersion = currentVersion.pump(increment);
            } else {
              requestedVersion = semver(version);
              // if current version on the server is greater or equal to requested
              // we have to stop execution here since we can't release component
              // with earlier version than current one.
              if (currentVersion.compare(requestedVersion) >= 0) {
                grunt.fatal('Requested version ' + requestedVersion.toString() + ' is less than current server version (' + currentVersion.toString() + ').');
              }
            }
            // save new version in bower component descriptor
            bowerComponent.content.version = bowerComponent.version = requestedVersion.toString();

            grunt.log.writeln(grunt.template.process('Releasing <%= name %>#<%= version %> ...', {data: bowerComponent}));

            // once new version number is known, we have store modified bower.json file and finalize release
            return q.fcall(fs.write, path.join(cwd, 'bower.json'), pp(bowerComponent.content))
                .then(git('add', '--all'))
                .then(git('commit', '--allow-empty', '-m', grunt.template.process(options.commitMessage, {data: bowerComponent})))
                .then(git('tag', bowerComponent.version))
                .then(git('push', '-f', '--tags', 'origin', 'master'));
          })
          .fail(function (error) {
            grunt.fatal(error.message);
          });
    }

    // components to release were specified manually (grunt release:compA:compB
    if (!_.isEmpty(components)) {
      releaseAll(components).done(finalize);
    } else if (bowerFiles.length === 1) { // there is only one discovered
      release(_.values(bowerComponents)[0]).done(finalize);
    } else {
      inquirer.prompt([
        {
          type: 'checkbox',
          name: 'components',
          message: 'Choose which components you want to release',
          choices: _.keys(bowerComponents)
        }
      ], function (answers) {
        releaseAll(answers.components).done(finalize);
      });
    }

  });

  //-------------------------------------------------
  // FS integration
  //-------------------------------------------------

  function readBowerFiles(root, paths) {
    var bowerFiles = {};
    _.each(paths, function (bowerFilePath) {
      bowerFilePath = path.join(root, bowerFilePath);
      var bowerFile = fs.readJSON(bowerFilePath);
      if (bowerFile) {
        this[bowerFile.name] = {
          name: bowerFile.name,
          content: bowerFile,
          version: bowerFile.version,
          dir: path.dirname(bowerFilePath),
          url: bowerFile.repository.url
        };
      } else {
        grunt.fatal('File ' + bowerFilePath + ' can\'t be read or is empty.');
      }
    }, bowerFiles);
    return bowerFiles;
  }

  /**
   * Performs recursive copy of the source directory content to the destination folder.
   * @param src source path.
   * @param dest destination path.
   */
  function cp(src, dest) {
    _.each(fs.expand(path.join(src, '**', '*')), function (filePath) {
      var relativePath = path.relative(src, filePath);
      var destination = path.join(dest, relativePath);
      if (fs.isDir(filePath)) {
        fs.mkdir(destination);
      } else {
        fs.copy(filePath, destination);
      }
    });
  }

  /**
   * Removes all files from given directory except .git folder and its' content.
   * @param dir path to directory that should be cleaned.
   */
  function clean(dir) {
    _.each(fs.expand(path.join(dir, '*')), function (filePath) {
      if (fs.exists(filePath) && filePath !== '.git') {
        grunt.log.debug('Deleting file ' + filePath + '...');
        fs.delete(filePath);
      }
    });
  }

  //-------------------------------------------------
  // GIT support
  //-------------------------------------------------

  function gitRunner(cwd) {
    return function git() {
      var args = grunt.util.toArray(arguments);
      grunt.log.debug('running: git ' + args.join(' '));
      return function () {
        var deferred = q.defer();
        grunt.util.spawn({
          cmd: 'git',
          args: args,
          opts: {cwd: cwd}
        }, function (error, output) {
          if (error) {
            var message = 'Error while running git command \'' +
                'git ' + args.join(' ') + '\' in directory \'' + cwd + '\'. ' +
                'Problem was caused by: ' + error.message;
            deferred.reject(new Error(message));
          } else {
            deferred.resolve(output);
          }
        });
        return deferred.promise;
      };
    };
  }

  //-------------------------------------------------
  // Async support
  //-------------------------------------------------

  function promise() {
    var args = grunt.util.toArray(arguments);
    return function () {
      return q.fcall.apply(this, args);
    };
  }

  //-------------------------------------------------
  // Semver support
  //-------------------------------------------------

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
        var partResult = compInt(this.toArray()[i], semver.toArray[i]);
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
    if (!_.contains(Semver.INCREMENTS, value)) {
      grunt.fatal('Given value \'' + value + '\' does not match any possible option for --increment flag. ' +
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

  /**
   * Factory method that creates new instance of Semver class for given string.
   *
   * @param versionString a string with version number for which Semver instance should be created.
   * @returns {module.Semver} a newly created Semver instance.
   */
  function semver(versionString) {
    return new Semver(versionString);
  }

  //-------------------------------------------------
  // JSON pretty print
  //-------------------------------------------------

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
  function pp(object) {
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
  }

};