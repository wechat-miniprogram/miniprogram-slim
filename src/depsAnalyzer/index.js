const fs = require('fs-extra')
const ora = require('ora')
const program = require('commander')
const path = require('path')
const inspect = require('util').inspect


const {genWxmlDepsGraph, genWxsDepsMap} = require('./wxml')
const {genEsModuleDepsGraph, genWxsModuleDepsGraph} = require('./esmodule')
const {genCompDepsGraph, genCompDepsMap} = require('./component')
const {genWxssDepsGraph} = require('./wxss')

const genAppDepsGraph = (app) => {
  // const appJsonPath = path.join(process.cwd(), app)
  const appJsonPath = './app.json'

  if (!fs.existsSync(appJsonPath)) {
    console.warn('Error: App.json is not exist')
    return
  }

  const result = {
    app: {},
    pages: [],
    subpackages: []
  }
  const appEsModuleGraph = genEsModuleDepsGraph(appJsonPath)
  const appWxssDepsGraph = genWxssDepsGraph(appJsonPath)
  const appCompDepsGraph = genCompDepsGraph(appJsonPath)

  result.app = {
    esDeps: Object.keys(appEsModuleGraph.map),
    wxssDeps: Object.keys(appWxssDepsGraph),
    compDeps: genCompDepsMap(appCompDepsGraph)
  }

  const appJson = fs.readJSONSync(appJsonPath)
  const appRoot = path.dirname(appJsonPath)
  const subpackages = appJson.subpackages || appJson.subPackages || []
  subpackages.forEach(subpackage => {
    const {root, pages} = subpackage
    pages.forEach(page => {
      const entry = path.join(appRoot, root, page)
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
      const relativePath = path.join(root, page)
      result.subpackages[relativePath] = {
        esDeps: Object.keys(esmoduleDepsGraph.map),
        wxmlDeps: Object.keys(wxmlDepsGraph),
        wxssDeps: Object.keys(wxssDepsGraph),
        compDeps: genCompDepsMap(compDepsGraph),
        wxsDeps
      }
    })
  })

  const entrys = appJson.pages
  entrys.forEach(entry => {
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
    console.log('entry', entry)
    console.log(inspect(esmoduleDepsGraph, {showHidden: false, depth: null}))
    result.pages[entry] = {
      esDeps: Object.keys(esmoduleDepsGraph.map),
      wxmlDeps: Object.keys(wxmlDepsGraph),
      wxssDeps: Object.keys(wxssDepsGraph),
      compDeps: genCompDepsMap(compDepsGraph),
      wxsDeps
    }
  })
  console.log('****** deps analyzer ******')
  // console.log(inspect(result, {showHidden: false, depth: null}))
}

program
  .command('analyzer')
  .description('Analyze dependencies of source code')
  .action(genAppDepsGraph)