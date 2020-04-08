const path = require('path')

const suffixExtname = (filePath, ext = 'js') => {
  const sep = path.sep
  const {dir, name} = path.parse(filePath)
  return `${dir}${sep}${name}.${ext}`
}

module.exports = {
  suffixExtname
}