const path = require('path')

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

module.exports = {
  suffixExtname,
  removeExtname,
  createLog,
  unique
}
