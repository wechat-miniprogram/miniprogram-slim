const fs = require('fs')
const {genWxmlDepsGraph, genWxsDepsMap} = require('./wxml')
const {genEsModuleDepsGraph, genWxsModuleDepsGraph} = require('./esmodule')
const {genCompDepsGraph, genCompDepsMap} = require('./component')
const {genWxssDepsGraph} = require('./wxss')
const {suffixExtname} = require('../utils/util')

// 分析组件的依赖情况，页面也可视为一个组件
const analyzeComponent = (entry) => {
  const esmoduleDepsGraph = genEsModuleDepsGraph(entry)
  const wxmlDepsGraph = genWxmlDepsGraph(entry)
  const wxssDepsGraph = genWxssDepsGraph(entry)
  const compDepsGraph = genCompDepsGraph(entry)
  const wxsMap = genWxsDepsMap(wxmlDepsGraph)
  const wxsDeps = []
  Object.values(wxsMap).forEach(wxsEntry => {
    const wxsDepsGraph = genWxsModuleDepsGraph(wxsEntry)
    const perWxsDeps = Object.keys(wxsDepsGraph.map)
    wxsDeps.push(...perWxsDeps)
  })
  let jsonPath = suffixExtname(entry, 'json')
  jsonPath = fs.existsSync(jsonPath) ? jsonPath : ''

  const esDeps = Object.keys(esmoduleDepsGraph.map)
  const wxmlDeps = Object.keys(wxmlDepsGraph)
  const wxssDeps = Object.keys(wxssDepsGraph)
  const compDeps = genCompDepsMap(compDepsGraph)
  const jsonDeps = [jsonPath]
  const files = [...wxmlDeps, ...wxssDeps, ...wxsDeps, ...esDeps, ...jsonDeps]

  return {
    esDeps,
    wxmlDeps,
    wxssDeps,
    compDeps,
    wxsDeps,
    jsonDeps,
    files
  }
}

const computeComponentSize = (compDep, allFileInfo) => {
  let totalSize = 0
  compDep.files.forEach(file => {
    const size = allFileInfo[file].size
    totalSize += size
  })

  return +totalSize.toFixed(2)
}


module.exports = {
  analyzeComponent,
  computeComponentSize
}
