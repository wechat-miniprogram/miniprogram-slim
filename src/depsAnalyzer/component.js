const glob = require('glob')
const path = require('path')
const fs = require('fs-extra')
const {suffixExtname} = require('./util')
const ext = 'json'

const weappNpmGlob = glob.sync('**/miniprogram_npm/', {ignore: '**/node_modules/**'})
const weappNpmPath = weappNpmGlob[0] || ''

const findAbsolutePath = (root, relativePath) => {
  // 相对/绝对路径
  const compPath = path.join(root, relativePath)
  if (fs.existsSync(suffixExtname(compPath, ext))) {
    return compPath
  }

  // 从 miniprogram_npm 中查找
  if (weappNpmPath) {
    const weappCompPath = path.join(weappNpmPath, relativePath)
    if (fs.existsSync(suffixExtname(weappCompPath, ext))) {
      return weappCompPath
    }
  }
  return ''
}

const singleJsonAnalyzer = (filePath) => {
  const config = fs.readJSONSync(filePath)
  const usingComponents = config.usingComponents || {}
  const dirname = path.dirname(filePath)
  const deps = {}
  Object.keys(usingComponents).forEach(comp => {
    const relativePath = usingComponents[comp]
    const depCompPath = findAbsolutePath(dirname, relativePath)
    deps[comp] = depCompPath
  })
  return {
    filePath,
    deps
  }
}

const genCompDepsGraph = (entry) => {
  entry = suffixExtname(entry, ext)

  const entryModule = singleJsonAnalyzer(entry)
  const deps = entryModule.deps
  const depsGraph = {[entry]: deps}
  
  Object.values(deps).forEach(entry => {
    Object.assign(depsGraph, genCompDepsGraph(entry))
  })
  return depsGraph
}

const genCompDepsMap = (compDepsGraph) => {
  const compMap = {}
  Object.values(compDepsGraph).forEach(item => {
    Object.assign(compMap, item)  
  })
  return compMap
}


module.exports = {
  genCompDepsGraph,
  genCompDepsMap
}