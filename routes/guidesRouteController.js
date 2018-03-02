const request = require('request'),
  fs = require('fs'),
  rimraf = require('rimraf'),
  path = require('path'),
  mds = require('markdown-serve'),
  breadcrumb = require('./breadcrumb'),
  responseHandler = require('./responseHandler'),
  logger = require('../logs/logger'),
  guideRootPath = 'guides',
  bakRootPath = 'guides-bak';

// Check to make sure the guides directory exists
let p = path.join(__dirname, '..', guideRootPath);
fs.exists(p, (exists) => {
  if (exists) return;

  fs.mkdir(p, (err) => {
    if (err) {
      return logger.error(err);  // TODO Make sure this is correct
    }
  })
});

// http://stackoverflow.com/a/24594123
function getDirectories(srcPath, requestPath) {
  var dirs = fs.readdirSync(srcPath)
    .filter(file => fs.statSync(path.join(srcPath, file)).isDirectory());
  return buildLinks(dirs, requestPath, srcPath);
}
function getFiles(srcPath, requestPath) {
  var files = fs.readdirSync(srcPath)
    .filter(file => fs.statSync(path.join(srcPath, file)).isFile());
  return buildLinks(files, requestPath, srcPath);
}
function buildLinks(files, requestPath, srcPath) {
  var links = [];
  for (var i = 0; i < files.length; i++) {
    let file = files[i];

    let itemPath = '/';//`/${guideRootPath}/`;
    if (requestPath !== '') {
      itemPath += `${requestPath}/`;
    }
    let url = itemPath + file.replace(/\s/g, '-');

    links.push({
      text: file,
      url: url,
      path: `${itemPath}${file}`
    })
  }
  return links;
}

/**
 * Removes any /guides/ from a path
 * @param {*} guidePath 
 */
function cleanGuidePath(guidePath) {
  return guidePath.replace(/(^\/)?(guides)?(\/)?/, '');
}

/**
 * Gets data for a guide section page, or data for a guide.
 * @param {*} req
 * @param {*} res 
 */
function getGuides(req, res) {
  // Setup the markdown server at /guides
  let docPath = path.resolve(__dirname, '..', guideRootPath);
  let markdownServer = new mds.MarkdownServer(docPath);

  // The req.path is the path to the markdown file.
  // So if the url is localhost:3000/api/guides/first, this will try to find a markdown file in the location /guides/first.md
  // We need to remove the /guides/ when searching in the markdownServer
  // We also need to remove the file extension, if it exists, to use that when searching in the markdownServer
  let requestPath = req.path.replace(/^\/guides/, '');
  let ext = path.extname(requestPath);
  let filePath = requestPath.replace(ext, '');
  markdownServer.get(filePath, (err, result) => {
    if (err) {
      // There was a problem finding the file, so this might be a directory instead
      resolveForDirectory(req, res, requestPath);
    } else {
      // Check if the request url has the .mnd file extension
      // If it does, return the markdown result
      // Otherwise, this is a directory
      if (ext === '.md') {
        resolveForFile(req, res, result, requestPath);
      } else {
        resolveForDirectory(req, res, requestPath);
      }
    }
  });
}

/**
 * Returns either a list of directories and files, or metadata detailing that nothing could be found.
 * @param {*} req 
 * @param {*} res 
 * @param {*} requestPath The path, excluding /guides
 */
function resolveForDirectory(req, res, requestPath) {
  // Remove any leading and trailing /'s
  requestPath = requestPath.replace(/^\//, '').replace(/\/\s*$/, '');
  let docsPath = path.resolve(__dirname, '..', guideRootPath, requestPath);
  let dirs, files;

  try {
    dirs = getDirectories(docsPath, requestPath) || [];
  } catch (err) {
    // Dir not found
    logger.error(err)
    dirs = [];
  }
  try {
    files = getFiles(docsPath, requestPath) || [];
  } catch (err) {
    // File not found
    logger.error(err)
    files = [];
  }

  // The title is the last item in the paths
  let paths = requestPath.split('/');
  let title = paths[paths.length - 1];

  if (dirs.length === 0 && files.length === 0) {
    // This is not a valid docs directory
    let breadcrumbs = breadcrumb.create(req, res);
    let message = 'Could not find any guides or guide directories';
    message += requestPath === '' ? '' : ` at: ${guideRootPath}/${requestPath}...`;

    let data = {
      title: title,
      message: message,
      breadcrumbs: breadcrumbs
    };
    return responseHandler.successResponse(req, res, data);
  } else {
    let breadcrumbs = breadcrumb.create(req, res);

    let data = {
      url: '/',//`${guideRootPath}`,
      title: title,
      dirs: dirs,
      files: files,
      breadcrumbs: breadcrumbs
    };
    return responseHandler.successResponse(req, res, data);
  }
}
/**
 * Returns a markdown file with metadata
 * @param {*} req 
 * @param {*} res 
 * @param {*} result The markdown result, with metadata
 * @param {*} requestPath The path to the markdown file, excluding /guides
 */
function resolveForFile(req, res, result, requestPath) {
  let breadcrumbs = breadcrumb.create(req, res);
  // Replace the last breadcrumb with the fileName
  let fileName = path.basename(result._file);
  breadcrumbs[breadcrumbs.length - 1].text = fileName;

  // The directory path should be the request path, without the final /item, since the final /item is part of the url path: /guides/docs/first to get the doc first.md in /guides/docs
  let dirPath = req.path.replace(/(\/\w)$/, '');

  let data = {
    markdown: result.rawContent,
    breadcrumbs: breadcrumbs,
    url: requestPath,//path.join(guideRootPath, requestPath),
    dirPath: dirPath,
    nameNoExt: fileName.replace(/(\.\w.*)$/, ''),
    title: fileName
  };

  if (result.meta) {
    let date = new Date(result.modified).toLocaleString();
    data.title = result.meta.title;
    data.author = result.meta.author;
    data.lastEdited = date;
  }

  return responseHandler.successResponse(req, res, data);
}

/**
 * Upload a new markdown file.
 * @param {*} req 
 * @param {*} res 
 */
function upload(req, res) {
  let guideUpload = req.body;
  if (!guideUpload) {
    return responseHandler.errorResponse(req, res, 'There was no markdown uploaded...');
  }
  let markdown = guideUpload.markdown;

  let fileName = guideUpload.title;
  let override = guideUpload.override;  // Allow for overriding if file paths are the same
  let isEdit = guideUpload.isEdit;

  // Remove a leading / and guides/ if they exist
  let guidePath = cleanGuidePath(guideUpload.url);
  // If it isEdit, we should not be including the fileName again
  guidePath = path.join(__dirname, '..', guideRootPath, guidePath, isEdit ? '' : fileName + '.md');
  let bakPath = path.join(__dirname, '..', bakRootPath, guidePath, isEdit ? '' : fileName + '.md');

  fs.exists(guidePath, (exists) => {
    if (exists && !override) {
      return responseHandler.errorResponse(req, res, 'File with that name already exists.', 409, `File at the path '${guidePath} already exists.`);
    } else {
      // Create the guide
      fs.writeFile(guidePath, markdown, (err) => {
        if (err) {
          return responseHandler.errorResponse(req, res, `Could not upload the guide to ${guidePath}...`, 400, err);
        }

        // Save the guide in the /guides-bak dir, but we don't need to wait for it
        fs.exists(bakPath, (exists) => {
          if (!exists || override) {
            fs.writeFile(bakPath, markdown, (err) => {
              if (err) {
                logger.error('Could not save the markdown in the bak dir...', err);
              }
            })
          }
        })

        return responseHandler.successResponse(req, res, true);
      });
    }
  });
}

module.exports = {
  get: getGuides
}
