const path = require('path')
const fs = require('fs-extra')
const {suffixExtname} = require("../utils/util")

let weappNpmPath = null
let root = null // 小程序或插件根目录

const setRoot = (p) => {
  root = p
}

const setWeappNpmPath = (p) => {
  weappNpmPath = p
}

const findAbsolutePath = ({
  filePath,
  relativePath,
  ext
}) => {
  // 包内文件: 根目录、相对目录
  const dirname = path.dirname(filePath)
  let absolutePath = null
  if (relativePath.startsWith('/')) {
    absolutePath = path.join(root, relativePath)
  } else {
    absolutePath = path.join(dirname, relativePath)
  }
  absolutePath = suffixExtname(absolutePath, ext)

  if (fs.existsSync(absolutePath)) {
    return absolutePath
  }

  if ((ext === 'js' || ext === 'json') && weappNpmPath) {
    // 可能是npm 包文件
    absolutePath = path.join(weappNpmPath, relativePath)
    absolutePath = suffixExtname(absolutePath, ext)
    if (fs.existsSync(absolutePath)) {
      return absolutePath
    }

    // 可能是npm 包目录
    absolutePath = path.join(weappNpmPath, relativePath, `index.${ext}`)
    if (fs.existsSync(absolutePath)) {
      return absolutePath
    }
  }
  return null
}

module.exports = {
  findAbsolutePath,
  setWeappNpmPath,
  setRoot
}