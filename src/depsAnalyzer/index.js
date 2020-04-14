const fs = require('fs-extra')
const ora = require('ora')
const program = require('commander')
const path = require('path')
const {createLog, printObject} = require('./util')
const {analyzeComponent} = require('./analyzerComp')
const {findUnusedFiles} = require('./unused')
const log = createLog('@index')
const {setWeappNpmPath} = require('./component')
const {genEsModuleDepsGraph} = require('./esmodule')


/**
 * 1. 忽略引用插件中的组件
 * 2. 编译后的小程序根目录进行查询
 */
const genAppDepsGraph = (root, cli) => {
  // log.setLevel('warn')

  // 默认当前目录为小程序根目录
  const miniprogramRoot = root || './'
  const ignore = (cli.ignore || '').split(',')
  const type = cli.type || 'app'

  const entry = type === 'app' ? 'app.json' : 'plugin.json'
  const appJsonPath = path.join(miniprogramRoot, entry)
  if (!fs.existsSync(appJsonPath)) {
    console.warn(`Error: ${appJsonPath} is not exist`)
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

  const {projectConfig, unusedCollection} = findUnusedFiles({
    miniprogramRoot,
    appDeps,
    ignore
  })

  const result = {
    projectConfig,
    unusedCollection,
    appDependencies: appDeps
  }

  const output = path.resolve('./', cli.output)
  fs.writeFileSync(output, JSON.stringify(result, null, 2))
}

program
  .command('analyzer [root]')
  .description('Analyze dependencies of source code')
  .option('-o, --output [path]', 'path to file for analyzer', './depsAnalyzer.json')
  .option('-t, --type [weappType]', 'app or plugin', 'app')
  .option('-i, --ignore <glob>', 'glob pattern for files what should be excluded')
  .action(genAppDepsGraph)