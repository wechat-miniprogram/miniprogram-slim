const path = require('path')
const inspect = require('util').inspect

const createLog = (module) => {
  const manager = require('simple-node-logger').createLogManager({
    timestampFormat:'YYYY-MM-DD HH:mm:ss'
  })
  const log = manager.createLogger(module)
  return log
}

const suffixExtname = (filePath, ext = 'js') => {
  const sep = path.sep
  const {dir, name} = path.parse(filePath)
  return dir ? `${dir}${sep}${name}.${ext}` : `${name}.${ext}`
}

const removeExtname = (filePath) => {
  const sep = path.sep
  const {dir, name} = path.parse(filePath)
  return dir ? `${dir}${sep}${name}` : `${name}`
}

const unique = (arr = []) => {
  return Array.from(new Set(arr))
}

const printObject = (Object) => {
  console.log(inspect(Object, {showHidden: false, depth: null}))
}

const genPackOptions = (unusedFiles, pluginRoot) => {
  const map = {}
  unusedFiles.forEach(file => {
    if (pluginRoot) {
      file = path.join(pluginRoot, file)
    }
    const ext = path.extname(file).replace('.', '')
    const name = removeExtname(file)
    if (!map[name]) map[name] = []
    map[name].push(ext)
  })
  const packOptions = {ignore:[]}
  Object.keys(map).forEach(name => {
    const exts = map[name]
    if (exts.length === 1) {
      packOptions.ignore.push({
        type: 'file',
        value: `${name}/${exts[0]}`
      })
    } else {
      packOptions.ignore.push({
        type: 'glob',
        value: `${name}.@(${exts.join('|')})`
      })
    }
  })
  return packOptions
}

module.exports = {
  suffixExtname,
  removeExtname,
  createLog,
  unique,
  printObject,
  genPackOptions
}
