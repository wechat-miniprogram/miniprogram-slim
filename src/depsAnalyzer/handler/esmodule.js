/* eslint-disable max-classes-per-file */

const fs = require('fs-extra')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const t = require('babel-types')
const {suffixExtname} = require('../utils/util')
const {findAbsolutePath} = require('./util')

const singleModuleAnalyser = ({filePath, ext}) => {
  const code = fs.readFileSync(filePath, 'utf-8')
  const ast = parser.parse(code, {sourceType: 'module'})
  const deps = {}
  traverse(ast, {
    CallExpression({node}) {
      const calleeName = node.callee.name
      if (calleeName === 'require') {
        const firstParam = node.arguments[0]
        if (t.isStringLiteral(firstParam)) {
          const depFilePath = findAbsolutePath({
            filePath,
            relativePath: firstParam.value,
            ext,
          })
          if (depFilePath) {
            deps[firstParam.value] = depFilePath
          }
        }
      }
    },

    ImportDeclaration({node}) {
      const depFilePath = findAbsolutePath({
        filePath,
        relativePath: node.source.value,
        ext,
      })
      if (depFilePath) {
        deps[node.source.value] = depFilePath
      }
    },
  })

  return {
    filePath,
    deps,
  }
}

const genModuleDepsGraph = ({entry, ext, stack = []}, depsGraphCache) => {
  entry = suffixExtname(entry, ext)
  if (!fs.existsSync(entry) || stack.includes(entry)) {
    return {}
  }
  if (depsGraphCache[entry]) {
    // using cache to avoid bug while meeting loop dep
    return depsGraphCache[entry]
  }

  stack.push(entry)
  const entryModule = singleModuleAnalyser({filePath: entry, ext})
  const deps = entryModule.deps
  depsGraphCache[entry] = deps

  Object.values(deps).forEach((entry) => {
    genModuleDepsGraph({entry, ext, stack}, depsGraphCache)
  })
  stack.pop()
  return depsGraphCache
}

const genModuleDepsGraphWithCache = (options) => {
  const depsGraphCache = {}
  return genModuleDepsGraph(options, depsGraphCache)
}

class Node {
  constructor(path, id = 0, children = []) {
    this.id = id
    this.path = path
    this.children = children
  }

  addChild(id) {
    this.children.push(id)
  }
}

class Graph {
  constructor() {
    this.nodes = []
    this.map = {}
    this.size = 0
  }

  addNode(node) {
    node.id = this.size
    this.map[node.path] = node.id
    this.nodes.push(node)
    this.size++
  }
}

/**
 * 格式化成邻接表
 * @param {*} moduleDepsGraph
 */
const formatModuleDepsGraph = (moduleDepsGraph) => {
  const graph = new Graph()
  Object.keys(moduleDepsGraph).forEach((entry) => {
    const node = new Node(entry)
    graph.addNode(node)
  })
  Object.keys(moduleDepsGraph).forEach((entry) => {
    const entryId = graph.map[entry]
    const deps = Object.values(moduleDepsGraph[entry])
    deps.forEach((dep) => {
      const id = graph.map[dep]
      graph.nodes[entryId].addChild(id)
    })
  })
  return graph
}

const genWxsModuleDepsGraph = (entry) => {
  const stack = []
  const moduleDepsGraph = genModuleDepsGraphWithCache({
    entry,
    ext: 'wxs',
    stack,
  })
  const graph = formatModuleDepsGraph(moduleDepsGraph)
  return graph
}

const genEsModuleDepsGraph = (entry) => {
  const stack = []
  const moduleDepsGraph = genModuleDepsGraphWithCache({
    entry,
    ext: 'js',
    stack,
  })
  const graph = formatModuleDepsGraph(moduleDepsGraph)
  return graph
}

module.exports = {
  genEsModuleDepsGraph,
  genWxsModuleDepsGraph,
}
