const fs = require('fs-extra')
const HTMLParser = require('node-html-parser')
const {suffixExtname} = require('../utils/util')
const {findAbsolutePath} = require('./util')

const traverseWxml = (root) => {
  const result = []
  const tagName = root.rawTagName
  if (root.nodeType !== 1) return result

  const keywords = ['import', 'include', 'wxs']
  if (keywords.includes(tagName)) {
    const rawAttrs = root.rawAttrs.split(' ')
    rawAttrs.forEach((attr) => {
      const pairs = attr.split('=')
      if (pairs[0] === 'src' && pairs[1]) {
        const route = pairs[1].replace(/'|"/g, '')
        const type = tagName === 'wxs' ? 'wxs' : 'wxml'
        result.push({
          type,
          route,
        })
      }
    })
  }
  const childNodes = root.childNodes
  childNodes.forEach((child) => {
    const childResult = traverseWxml(child)
    result.push(...childResult)
  })
  return result
}

// 找出 import & include 引用的路径依赖
const singleWxmlAnalyser = (filePath) => {
  const wxml = fs.readFileSync(filePath, 'utf-8')
  const root = HTMLParser.parse(wxml, {
    lowerCaseTagName: true,
    script: false,
    style: false,
    pre: false,
    comment: false,
  })

  const wxmlDeps = {}
  const wxsDeps = {}
  const depFiles = traverseWxml(root)
  depFiles.forEach((item) => {
    const {type, route} = item
    const depFilePath = findAbsolutePath({
      filePath,
      relativePath: route,
      ext: type,
    })
    if (depFilePath) {
      if (type === 'wxml') {
        wxmlDeps[route] = depFilePath
      } else {
        wxsDeps[route] = depFilePath
      }
    }
  })

  return {
    filePath,
    wxmlDeps,
    wxsDeps,
  }
}

const genWxmlDepsGraph = (entry) => {
  entry = suffixExtname(entry, 'wxml')
  if (!fs.existsSync(entry)) return {}

  const entryModule = singleWxmlAnalyser(entry)
  const {wxsDeps, wxmlDeps} = entryModule
  const depsGraph = {
    [entry]: {
      wxsDeps,
      wxmlDeps,
    },
  }

  Object.values(wxmlDeps).forEach((entry) => {
    Object.assign(depsGraph, genWxmlDepsGraph(entry))
  })
  return depsGraph
}

const genWxsDepsMap = (wxmlDepsGraph) => {
  const wxsMap = {}
  Object.values(wxmlDepsGraph).forEach((item) => {
    Object.assign(wxsMap, item.wxsDeps)
  })
  return wxsMap
}

module.exports = {
  genWxmlDepsGraph,
  genWxsDepsMap,
}
