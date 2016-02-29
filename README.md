# grunt-release-bower

> The `release-bower` is [GruntJS](http://gruntjs.com/) task implementation, that automates
  process of releasing bower components.

This plugin was build in order to support scenario where one code base produces several self-contained bower components,
each with own dependencies, like more complex library. However can be easily used with more classical approach
(one code base -> one component) as well.

## How that works?
The `release-bower` Grunt task scans your project tree starting from directory indicated in configuration (usually folder
that contains final build artifacts), and detects `bower.json` files creating on the fly list of corresponding bower components.
Each discovered component can be released by the task. The new version of component can be fixed upfront or automatically
changed taking into account last released version and increment factor provided by user (according to [Semver specification](http://semver.org).

## Getting Started
This plugin requires Grunt `>0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-release-bower --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-release-bower');
```

Voilà! Now you can use `release-bower` task with command line : `grunt release-bower`. (But before please read Configuration chapter ;))

## Usage

#### How specify component to release?

#### Command line

You can provide list of component to release via command line. After task name provide names of components
to release separated by colon marks:

     grunt release-bower:component:component-18n:component-ui

#### Manual

If you don't provide list of component to release in command line, and plugin detect more than one bower component
available, you will be prompted to choose which components should be released.

Sample:

     > grunt release-bower
     Running "release-bower" task
      [?] Choose which components you want to release: (Press <space> to select)
     >[ ] component-feature
      [X] component-kendo
      [ ] component

<div class="alert alert-info" style="margin: 10px;">If there is only one bower component in classpath, plugin will start
release process with asking user.</div>

### How control version numbers?

The `release-bower` task provides several methods to specify version of artifact to release.

#### `bower.json`

In `bower.json` file corresponding to bower component you can either provide fixed next version, or use variable ``auto``,
which instructs plugin to automatically pump version of component (increment step can be defined via ``--increment`` flag).

Example (`bower.json`):

     {
         "name": "component",
         "version": "auto",
         "authors": [
             "Jan Korona <Jan.Korona@gmail.com>"
         ],
         "description": "Core part of library.",
         ....
     }

#### command line flag

See chapter _Configuration -> Command line_

## Options

There are two sources of configuration for `release-bower` task plugin:

- `Gruntfile.js` options
- Command line parameters

### `Gruntfile.js`

<table>
    <tr>
        <th width="40">Option</th>
        <th width="300">Description</th>
        <th width="250">Default</th>
    </tr>
    <tr>
        <td>``scanPath``</td>
        <td>Specifies project directory which should be scanned in search for bower components to release.</td>
        <td>`dist`</td>
    </tr>
    <tr>
        <td>``tmpDir``</td>
        <td>
            Specifies name of the directory that will be created by task in runtime and used as workplace.
            This directory will be removed after task finish processing.
        </td>
        <td>`tmp`</td>
    </tr>
    <tr>
        <td>``commitMessage``</td>
        <td>
            A default message template used to commit new released version to version control repository.
            Template has two variables:
            <ul>
                <li>name - indicates name of the released component.</li>
                <li>version - new version of component.</li>
            </ul>
        </td>
        <td>`'Release <%= name %>, version <%= version %>.'`</td>
    </tr>
</table>

#### Sample configuration

     "release-bower": {
         options: {
             scanPath: 'dist',
             tmpDir: 'tmp',
             commitMessage: 'Release <%= name %>, version <%= version %>.'
         }
     }

### Command line

In addition to `Gruntfile.js` options, you can use few flags in command line.

------------------------------------------------------------------------------

#### ``--increment``

Specifies increment step that should be automatically applied to the newly released bower component.
According to [Semver](http://semver.org) specification you can used one of :

- major
- minor
- patch

Default value for this flag is _patch_.

Sample:

     grunt bower-release --increment=minor

#### ``--ver``

This flag allows you fix version of component to release. Of course you have to remember to follow rules
of Semver specification.

Sample:

     grunt release-bower --version=1.2.3

#### ``--all``

With that flag all modules will be release in one shot. If the modules do not have the same version yet, you have to add
the --ver argument in order to specify the first common version.

Sample:

      grunt release-bower --all --ver=1.2.3

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
2015-02-05 Initial version 0.1.0 released.
2016-02-29 Patch 0.1.6 with support for GruntJS 1.0.
