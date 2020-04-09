const path = require('path')

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

module.exports = {
  suffixExtname,
  removeExtname
}
