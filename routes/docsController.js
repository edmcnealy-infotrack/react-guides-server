const request = require('request');
const fs = require('fs');
const path = require('path');

const docsFolder = path.join(__dirname, '..');
const mdRegex = /.markdown|.mdown|.mkdn|.md|.mkd|.mdwn|.mdtxt|.mdtext|.text|.Rmd/;

let get = (req, res) => {
  let requestPath = path.join(docsFolder, req.path);
  let ext = path.extname(requestPath);

  if (!ext) {
    // This is a directory
    readDirectory(requestPath, (err, files) => {
      if (err) {
        return errorResponse(res, err);
      }

      return res.send(files);
    });
  } else {
    if (isMarkdown(ext)) {
      // This is a valid markdown file request
    } else {
      // Invalid request
      return errorResponse(res, 'You need to request a valid markdown file or directory.');
    }
  }
  
  
}

function readDirectory(directoryPath, callback) {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return callback('There was a problem getting the Docs folder contents. ' + err);
    }

    var items = [];
    files.forEach(file => {
      var ext = path.extname(file);
      if (!ext) {
        items.push({
          filename: file.replace(/\s+/g, '_'),
          isDir: true
        });
      } else {
        // Only include if the file is markdown
        if (isMarkdown(file)) {
          items.push({
            filename: file,
            isDir: false
          });
        }
      }
    });

    callback(null, items);
  })
}

function errorResponse(res, message) {
  return res.status(400).send({message});
}

function isMarkdown(ext) {
  if (ext) {
    let matches = ext.match(mdRegex);
    return matches && matches.length > 0;
  }
  return false;
}

module.exports = {
  get: get
}