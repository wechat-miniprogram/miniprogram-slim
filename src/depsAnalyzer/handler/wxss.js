const fs = require('fs-extra')
const path = require('path')
const css = require('css');
const {suffixExtname} = require('../utils/util')
const {findAbsolutePath} = require('./util')

const traverseWxss = (ast) => {
  const result = [] // 找出 import 引入的文件
  const rules = ast.stylesheet.rules
  rules.forEach(rule => {
    if (rule.type === 'import') {
      const route = rule.import.replace(/\'|\"/g, '')
      result.push(route)
    }
  })
  return result
}

// 找出 import 引入的文件
const singleWxssAnalyser = (filePath) => {
  const wxss = fs.readFileSync(filePath, 'utf-8')
  const ast = css.parse(wxss, { source: filePath })

  const deps = {}
  const dirname = path.dirname(filePath)
  const depWxssFiles = traverseWxss(ast)
  depWxssFiles.forEach(relativePath => {
    const depFilePath = findAbsolutePath({
      filePath, 
      relativePath,
      ext: 'wxss'
    })
    if (depFilePath) {
      deps[relativePath] = depFilePath
    }
  })

  return {
    filePath,
    deps,
  }
}

const genWxssDepsGraph = (entry) => {
  entry = suffixExtname(entry, 'wxss')
  if (!fs.existsSync(entry)) return {}
  
  const entryModule = singleWxssAnalyser(entry)
  const deps = entryModule.deps
  const depsGraph = {[entry]: deps}

  Object.values(deps).forEach(entry => {
    Object.assign(depsGraph, genWxssDepsGraph(entry))
  })
  return depsGraph
}

module.exports = {
  genWxssDepsGraph
}