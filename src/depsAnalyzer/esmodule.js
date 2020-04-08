const fs = require('fs-extra')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const {suffixExtname} = require('./util')
const t = require('babel-types')

const singleEsModuleAnalyser = (filePath, ext) => {
  const code = fs.readFileSync(filePath, 'utf-8')
  const ast = parser.parse(code, {sourceType: 'module'})
  const deps = {}
  traverse(ast, {
    CallExpression({node}) {
      const calleeName = node.callee.name
      if (calleeName === 'require') {
        const firstParam = node.arguments[0]
        if (t.isStringLiteral(firstParam)) {
          const dirname = path.dirname(filePath)
          const depFilePath = path.join(dirname, firstParam.value)
          const depFilePathWithExt = suffixExtname(depFilePath, ext)
          if (fs.existsSync(depFilePathWithExt)) {
            deps[firstParam.value] = depFilePathWithExt
          }
        }
      }
    },

    ImportDeclaration({ node }) {
      const dirname = path.dirname(filePath)
      const depFilePath = path.join(dirname, node.source.value)
      const depFilePathWithExt = suffixExtname(depFilePath, ext)
      if (fs.existsSync(depFilePathWithExt)) {
        deps[node.source.value] = depFilePathWithExt
      }
    }
  })

  return {
    filePath,
    deps,
  }
}

const getModuleDepsGraph = (entry, ext) => {
  entry = suffixExtname(entry, ext)
  const entryModule = singleEsModuleAnalyser(entry, ext)
  const deps = entryModule.deps
  const depsGraph = {[entry]: deps}
  Object.values(deps).forEach(entry => {
    Object.assign(depsGraph, getModuleDepsGraph(entry, ext))
  })
  return depsGraph
}

const getWxsModuleDepsGraph = (entry) => {
  return getModuleDepsGraph(entry, 'wxs')
}

const genEsModuleDepsGraph = (entry) => {
  return getModuleDepsGraph(entry, 'js')
}

module.exports = {
  genEsModuleDepsGraph,
  getWxsModuleDepsGraph
}