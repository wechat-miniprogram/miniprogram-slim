const fs = require('fs-extra')
const {suffixExtname} = require('../utils/util')
const {findAbsolutePath} = require('./util')

// 忽略插件中的组件
const singleJsonAnalyzer = (filePath) => {
  const config = fs.readJSONSync(filePath)
  const usingComponents = config.usingComponents || {}
  const deps = {}
  Object.keys(usingComponents).forEach(comp => {
    const relativePath = usingComponents[comp]
    if (!relativePath.startsWith('plugin://')) {
      const depCompPath = findAbsolutePath({
        filePath, 
        relativePath,
        ext: 'json'
      })
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
  entry = suffixExtname(entry, 'json')
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
  genCompDepsGraph,
  genCompDepsMap,
}