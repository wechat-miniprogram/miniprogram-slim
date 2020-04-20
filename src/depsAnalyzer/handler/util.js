const path = require('path')
const fs = require('fs-extra')
const {suffixExtname} = require('../utils/util')

const findNpmPath = ({
  cwd,
  relativePath,
  ext
}) => {
  const dir = 'miniprogram_npm/'
  const absoluteRoot = process.cwd()
  const weappNpmPath = path.join(cwd, dir)
  let absolutePath

  if (fs.existsSync(weappNpmPath)) {
    // 可能是npm 包文件
    absolutePath = path.join(weappNpmPath, relativePath)
    absolutePath = suffixExtname(absolutePath, ext)
    if (fs.existsSync(absolutePath)) {
      return path.relative(absoluteRoot, absolutePath)
    }

    // 可能是npm 包目录
    absolutePath = path.join(weappNpmPath, relativePath, `index.${ext}`)
    if (fs.existsSync(absolutePath)) {
      return path.relative(absoluteRoot, absolutePath)
    }
  }

  if (cwd === absoluteRoot) {
    return null
  }

  return findNpmPath({
    cwd: path.resolve(cwd, '../'),
    relativePath,
    ext
  })
}

const findAbsolutePath = ({
  filePath,
  relativePath,
  ext
}) => {
  // 包内文件: 根目录、相对目录
  const dirname = path.dirname(filePath)
  let absolutePath = null
  // 当前在根目录之下
  if (relativePath.startsWith('/')) {
    absolutePath = path.join('./', relativePath)
  } else {
    absolutePath = path.join(dirname, relativePath)
  }
  absolutePath = suffixExtname(absolutePath, ext)

  if (fs.existsSync(absolutePath)) {
    return absolutePath
  }
  console.log('@@', filePath, relativePath)
  if (ext === 'js' || ext === 'json') {
    absolutePath = findNpmPath({
      relativePath,
      cwd: path.resolve(dirname, './'),
      ext
    })
    if (absolutePath) {
      return absolutePath
    }
  }
  console.log('@@', absolutePath)
  return null
}

module.exports = {
  findAbsolutePath
}
