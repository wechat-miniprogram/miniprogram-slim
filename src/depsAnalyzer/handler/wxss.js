const fs = require('fs-extra')
const path = require('path')
const css = require('css');
const {suffixExtname} = require('../utils/util')
const ext = 'wxss'

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
    const depFilePath = path.join(dirname, relativePath)
    deps[relativePath] = suffixExtname(depFilePath, ext) 
  })

  return {
    filePath,
    deps,
  }
}

const genWxssDepsGraph = (entry) => {
  entry = suffixExtname(entry, ext)
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