const fs = require('fs-extra')
const ora = require('ora')
const program = require('commander')
const path = require('path')
const inspect = require('util').inspect
const {createLog} = require('./util')
const {analyzeComponent} = require('./analyzerComp')
const {findUnusedFiles} = require('./unused')
const log = createLog('@index')
const {setWeappNpmPath} = require('./component')
const {genEsModuleDepsGraph} = require('./esmodule')


/**
 * 1. 忽略引用插件中的组件
 * 2. 编译后的小程序根目录进行查询
 */
const genAppDepsGraph = (entry) => {
  // log.setLevel('warn')

  const appJsonPath = entry || 'app.json'
  if (!fs.existsSync(appJsonPath)) {
    console.warn(`Error: ${entry} is not exist`)
    return
  }
  const miniprogramRoot = path.dirname(appJsonPath)
  const type = path.basename(appJsonPath, '.json')

  if (type !== 'app' && type !== 'plugin') {
    console.warn(`Error: entry must be app.json or plugin.json`)
    return
  }

  const appDeps = {
    app: {}, // 代表全局的含义
    pages: {},
    subpackages: {}
  }
  // 设置正确的npm包路径
  setWeappNpmPath(miniprogramRoot)

  appDeps.app = analyzeComponent(appJsonPath)

  // 针对插件的特殊处理
  if (type === 'plugin') {
    const pluginJson = fs.readJSONSync(appJsonPath)
    const main = pluginJson.main || 'index.js'
    const entry = path.join(miniprogramRoot, main)
    const esmoduleDepsGraph = genEsModuleDepsGraph(entry)
    appDeps.app.esDeps = Object.keys(esmoduleDepsGraph.map) 
  }

  const appJson = fs.readJSONSync(appJsonPath)
  const subpackages = appJson.subpackages || appJson.subPackages || []
  subpackages.forEach(subpackage => {
    const {root, pages} = subpackage
    pages.forEach(page => {
      const entry = path.join(miniprogramRoot, root, page)
      const relativePath = path.join(root, page)
      appDeps.subpackages[relativePath] = analyzeComponent(entry)
    })
  })

  const pages = appJson.pages || []
  pages.forEach(page => {
    const entry = path.join(miniprogramRoot, page)
    appDeps.pages[page] = analyzeComponent(entry)
  })
  // console.log(inspect(appDeps, {showHidden: false, depth: null}))
  
  const unused = findUnusedFiles(miniprogramRoot, appDeps)
  console.log('unsed files:')
  console.log(unused)
}

program
  .command('analyzer [entry]')
  .description('Analyze dependencies of source code')
  .action(genAppDepsGraph)