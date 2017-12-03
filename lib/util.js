const lazyreq = require('lazy-req').proxy(require);
const n_atom = lazyreq('atom');

function pathShorten(str, maxLength, removeFilename) {
    var splitter = str.indexOf('/')>-1 ? '/' : "\\",
        tokens = str.split(splitter),
        removeFilename = !!removeFilename,
        maxLength = maxLength || 25,
        drive = str.indexOf(':')>-1 ? tokens[0] : "",
        fileName = tokens[tokens.length - 1],
        len = removeFilename ? drive.length  : drive.length + fileName.length,
        remLen = maxLength - len - 5, // remove the current lenth and also space for 3 dots and 2 slashes
        path, lenA, lenB, pathA, pathB;
    //remove first and last elements from the array
    tokens.splice(0, 1);
    tokens.splice(tokens.length - 1, 1);
    //recreate our path
    path = tokens.join(splitter);
    //handle the case of an odd length
    lenA = Math.ceil(remLen / 2);
    lenB = Math.floor(remLen / 2);
    //rebuild the path from beginning and end
    pathA = path.substring(0, lenA);
    pathB = path.substring(path.length - lenB);
    path = drive + splitter + pathA + "..." + pathB + splitter ;
    path = path + (removeFilename ? "" : fileName);
    //console.log(tokens, maxLength, drive, fileName, len, remLen, pathA, pathB);
    return path;
}

function isUriOpen(uri) {
  for (let editor of atom.workspace.getTextEditors()) {
    if (editor.getPath() === uri) {
      return true;
    }
  }
  return false;
}

// This prevents us from attempting to open the same file more than once at a
// time, we can serialize the requests instead
var s_editorPromises = {};

function getTextEditor(filename) {
  if (isUriOpen(filename)) {
    return atom.workspace.open(filename, {activateItem: false})
  }

  if (s_editorPromises[filename]) {
      return s_editorPromises[filename];
  }

  s_editorPromises[filename] =  atom.workspace.open(filename, {activateItem: false})
  .then((editor) => {
    return editor.getBuffer().load()
      .then(() => editor);
  })
  .then((editor) => {
    s_editorPromises[filename] = null;
    return editor;
  });

  return s_editorPromises[filename];
}


module.exports.matched_scope = function (editor, acceptableScopes) {
    let rootScopeDescriptor = editor.getRootScopeDescriptor().scopes[0];

    if (!acceptableScopes) {
      acceptableScopes = ['source.cpp', 'source.c', 'source.h', 'source.hpp'];
    }

    if (acceptableScopes.indexOf(rootScopeDescriptor) > -1) {
      return true;
    }

    return false;
  }

module.exports.isUriOpen = isUriOpen;

module.exports.pathShorten = pathShorten;

module.exports.getTextEditor = getTextEditor;

module.exports.getTextBuffer = function(filename){
  return getTextEditor(filename)
  .then((editor) => editor.getBuffer());
}

module.exports.getCurrentWordBufferRange = function(editor) {
  let cursor = editor.getLastCursor();
  let wordRegExp = cursor.wordRegExp({includeNonWordCharacters: false});
  let wordRange = cursor.getCurrentWordBufferRange({wordRegex: wordRegExp});
  return wordRange;
}
