const server = require('markdown-serve');
const path = require('path');

const docsFolder = path.resolve(__dirname, 'docs');
const markdownServer = new server.MarkdownServer(docsFolder);

let handle = (req, res, next) => {
  if (req.method !== 'GET') next();

  markdownServer.get(req.path, (err, result) => {
    if (err) {
      console.error(err);
      next();
      return;
    }

    if (result.meta && !result.meta.draft) {
      let data = {
        title: markdownFile.meta.title,
        content: markdownFile.parseContent()
      }
    }
  })
}