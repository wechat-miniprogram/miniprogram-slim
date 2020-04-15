const fs = require('fs-extra')
const ora = require('ora')
const program = require('commander')
const path = require('path')
const {createLog, printObject, genPackOptions} = require('./util')
const {analyzeComponent} = require('./analyzerComp')
const {findUnusedFiles} = require('./unused')
const {genEsModuleDepsGraph} = require('./esmodule')
const shell = require('shelljs')
const perf = require('execution-time')()


/**
 * 1. 忽略引用插件中的组件
 * 2. 当前目录为 project.config.json 目录
 */
const genAppDepsGraph = (cli) => {
  // log.setLevel('warn')

  const projectConfigPath = './project.config.json'
  if (!fs.existsSync(projectConfigPath)) {
    console.warn(`Error: project.config.json is not exist`)
    return
  }

  const projectConfig = fs.readJSONSync(projectConfigPath)
  const {
    compileType = 'miniprogram',
    miniprogramRoot = './',
    pluginRoot = 'plugin'
  } = projectConfig

  const cwd = process.cwd()
  const ignore = cli.ignore ? cli.ignore.split(',') : []
  const root = compileType === 'miniprogram' ? miniprogramRoot : pluginRoot

  // 所有的操作均在代码根目录进行
  shell.cd(root)
  const entryPath = compileType === 'miniprogram' ? 'app.json' : 'plugin.json'

  const entryJson = fs.readJSONSync(entryPath)
  const pages = compileType === 'miniprogram' ? entryJson.pages : Object.values(entryJson.pages || {})

  const dependencies = {
    app: {},
    pages: {},
    subpackages: {}
  }

  perf.start('global')
  perf.start()
  const spinner = ora(`analyze ${entryPath}`).start()
  // app plugin 处理
  dependencies.app = analyzeComponent(entryPath)

  // 针对插件的特殊处理
  if (compileType === 'plugin') {
    const mainPath = entryJson.main || 'index.js'
    const esmoduleDepsGraph = genEsModuleDepsGraph(mainPath)
    dependencies.app.esDeps = Object.keys(esmoduleDepsGraph.map) 
    dependencies.app.files.push(...dependencies.app.esDeps)
  }
  spinner.succeed(`analyze ${entryPath} success, used ${Math.ceil(perf.stop().time)}ms`)

  // 分包处理
  if (compileType === 'miniprogram') {
    perf.start()
    spinner.start('analyzer subpackages')

    const subpackages = entryJson.subpackages || entryJson.subPackages || []
    subpackages.forEach(subpackage => {
      const {root, pages} = subpackage
      pages.forEach(page => {
        const entry = path.join(root, page)
        dependencies.subpackages[entry] = analyzeComponent(entry)
      })
    })

    spinner.succeed(`analyzer subpackages success, used ${Math.ceil(perf.stop().time)}ms`)
  }

  // 页面处理
  perf.start()
  spinner.start('analyzer pages')

  pages.forEach(page => {
    dependencies.pages[page] = analyzeComponent(page)
  })
  spinner.succeed(`analyzer pages success, used ${Math.ceil(perf.stop().time)}ms`)


  //  无用文件
  perf.start()
  spinner.start('find unusedFiles')
  const unusedFiles = findUnusedFiles({dependencies, ignore})
  spinner.succeed(`find unusedFiles success, used ${Math.ceil(perf.stop().time)}ms`)

  // 生成打包配置
  perf.start()
  spinner.start('generate packOptions')
  const packOptions = genPackOptions(unusedFiles, compileType === 'plugin' ? pluginRoot : '')
  const result = {
    packOptions,
    unusedFiles,
    dependencies
  }
  spinner.succeed(`generate packOptions success, used ${Math.ceil(perf.stop().time)}ms`)

  // 输出结果
  spinner.start('write output')
  shell.cd(cwd)
  const outputDir = cli.output 
  const outputJsonFile = path.join(outputDir, 'result.json')
  fs.ensureDirSync(outputDir)
  fs.writeFileSync(outputJsonFile, JSON.stringify(result, null, 2))

  spinner.succeed(`finish, everything looks good, total used ${Math.ceil(perf.stop('global').time)}ms`)
}

program
  .command('analyzer')
  .description('Analyze dependencies of source code')
  .option('-o, --output [dir]', 'path to directory for analyzer', './analyzer')
  .option('-i, --ignore <glob>', 'glob pattern for files what should be excluded')
  .action(genAppDepsGraph)