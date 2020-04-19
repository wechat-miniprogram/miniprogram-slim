const glob = require('glob')
const path = require('path')
const fs = require('fs-extra')
const {suffixExtname} = require('../utils/util')
const ext = 'json'

let weappNpmPath = null
let hasSearchNpm = false

const setWeappNpmPath = () => {
  hasSearchNpm = true
  const weappNpmGlob = glob.sync('**/miniprogram_npm/', {
    ignore: '**/node_modules/**'
  })
  weappNpmPath = weappNpmGlob[0] || null
}

const findAbsolutePath = (root, relativePath) => {
  // 相对、绝对路径
  const compPath = path.join(root, relativePath)
  if (fs.existsSync(suffixExtname(compPath, ext))) {
    return compPath
  }

  // 从 miniprogram_npm 中查找
  if (!hasSearchNpm) {
    setWeappNpmPath()
  }
  if (weappNpmPath) {
    const weappCompPath = path.join(weappNpmPath, relativePath)
    if (fs.existsSync(suffixExtname(weappCompPath, ext))) {
      return weappCompPath
    }
  }
  return ''
}

// 忽略插件中的组件
const singleJsonAnalyzer = (filePath) => {
  const config = fs.readJSONSync(filePath)
  const usingComponents = config.usingComponents || {}
  const dirname = path.dirname(filePath)
  const deps = {}
  Object.keys(usingComponents).forEach(comp => {
    const relativePath = usingComponents[comp]
    if (!relativePath.startsWith('plugin://')) {
      const depCompPath = findAbsolutePath(dirname, relativePath)
      if (depCompPath) {
        deps[comp] = depCompPath
      }
    }
  })
  return {
    filePath,
    deps
  }
}

const genCompDepsGraph = (entry) => {
  entry = suffixExtname(entry, ext)
  if (!fs.existsSync(entry)) return {}
  
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
  const compDeps = Object.values(compMap)
  return compDeps
}


module.exports = {
  setWeappNpmPath,
  genCompDepsGraph,
  genCompDepsMap,
  findAbsolutePath
}