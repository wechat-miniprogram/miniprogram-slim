const fs = require('fs-extra')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const {suffixExtname} = require('./util')
const t = require('babel-types')

const singleModuleAnalyser = (filePath, ext) => {
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

const genModuleDepsGraph = ({entry, ext} = {}) => {
  entry = suffixExtname(entry, ext)
  const entryModule = singleModuleAnalyser(entry, ext)
  const deps = entryModule.deps
  const depsGraph = {[entry]: deps}
  Object.values(deps).forEach(entry => {
    Object.assign(depsGraph, genModuleDepsGraph({entry, ext}))
  })
  return depsGraph
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
  Object.keys(moduleDepsGraph).forEach(entry => {
    const node = new Node(entry)
    graph.addNode(node)
  })
  Object.keys(moduleDepsGraph).forEach(entry => {
    const entryId = graph.map[entry]
    const deps = Object.values(moduleDepsGraph[entry])
    deps.forEach(dep => {
      const id = graph.map[dep]
      graph.nodes[entryId].addChild(id)
    })
  })
  return graph
}

const genWxsModuleDepsGraph = (entry) => {
  const moduleDepsGraph = genModuleDepsGraph({entry, ext: 'wxs'})
  const graph = formatModuleDepsGraph(moduleDepsGraph)
  return graph
}

const genEsModuleDepsGraph = (entry) => {
  const moduleDepsGraph = genModuleDepsGraph({entry, ext: 'js'})
  const graph = formatModuleDepsGraph(moduleDepsGraph)
  return graph
}

module.exports = {
  genEsModuleDepsGraph,
  genWxsModuleDepsGraph
}