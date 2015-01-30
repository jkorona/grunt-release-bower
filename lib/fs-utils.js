var path = require('path');

module.exports = function (ctx) {

    /**
     * Performs recursive copy of the source directory content to the destination folder.
     * @param src source path.
     * @param dest destination path.
     */
    this.cp = function (src, dest) {
        ctx._.each(ctx.fs.expand(path.join(src, '**', '*')), function (filePath) {
            var relativePath = path.relative(src, filePath);
            var destination = path.join(dest, relativePath);
            if (ctx.fs.isDir(filePath)) {
                ctx.fs.mkdir(destination);
            } else {
                ctx.fs.copy(filePath, destination);
            }
        });
    };

    /**
     * Removes all files from given directory except .git folder and its' content.
     * @param dir path to directory that should be cleaned.
     */
    this.clean = function (dir) {
        ctx._.each(ctx.fs.expand(path.join(dir, '*')), function (filePath) {
            if (ctx.fs.exists(filePath) && filePath !== '.git') {
                ctx.debug('Deleting file ' + filePath + '...');
                ctx.fs.delete(filePath);
            }
        });
    };

    return this;
};
