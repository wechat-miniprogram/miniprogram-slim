const path = require('path')
const glob = require('glob')
const fs = require('fs-extra')
const {removeExtname, printObject} = require('./util')
const {difference} = require('./setOperation')
const {analyzeComponent} = require('./analyzerComp')

const defaultIgnores = [
  '**/node_modules/**',
  '**/package.json',
  '**/package-lock.json',
  'project.config.json',
  'sitemap.json'
]

const findAllComponent = (miniprogramRoot, ignore = []) => {
  const jsonFiles = glob.sync('**/*.json', {
    ignore: [...ignore, ...defaultIgnores],
    cwd: miniprogramRoot
  })
  const components = []

  for (let filePath of jsonFiles) {
    const realPath = path.join(miniprogramRoot, filePath)
    const content = fs.readJSONSync(realPath)
    if (content.component === true) {
      components.push(removeExtname(realPath))
    }
  }
  return components
}

// 所有的 wxml & wxss & js 文件
const findAllFiles = (miniprogramRoot, ignore = []) => {
  const allFiles = []
  const exts = ['wxml', 'wxss', 'wxs', 'js', 'json']
  exts.forEach(ext => {
    const files = glob.sync(`**/*.${ext}`, {
      ignore: [...ignore, ...defaultIgnores],
      cwd: miniprogramRoot
    })
    const realPathFile = files.map(file => path.join(miniprogramRoot, file))
    allFiles.push(...realPathFile)
  })
  return allFiles
}

const findUnusedFiles = ({miniprogramRoot, appDeps, ignore = []}= {}) => {
  const components = findAllComponent(miniprogramRoot, ignore)
  const componentDeps = {}
  components.forEach(comp => {componentDeps[comp] = analyzeComponent(comp)})

  const {app, pages, subpackages} = appDeps
  const deps = [app, ...Object.values(pages), ...Object.values(subpackages)]
  const usedCompSet = new Set()
  deps.forEach(item => {
    item.compDeps.forEach(comp => usedCompSet.add(comp))
  })
  usedCompSet.forEach(comp => {componentDeps[comp] && deps.push(componentDeps[comp])})

  // 未使用的组件
  const allCompSet = new Set(components)
  const unusedCompSet = difference(allCompSet, usedCompSet)
  const allCompFiles = []
  Object.values(componentDeps).forEach(item => {
    allCompFiles.push(...item.wxmlDeps, ...item.wxssDeps, ...item.wxsDeps, ...item.esDeps, ...item.jsonDeps)
  })
  const allCompFileSet = new Set(allCompFiles)

  // 所有文件
  const allFiles = findAllFiles(miniprogramRoot, ignore)
  const allFileSet = new Set(allFiles)
  // const allFilesExceptComp = allFiles.filter(file => !allCompFileSet.has(file))
  // const allFileExceptCompSet = new Set(allFilesExceptComp)

  // 已使用的文件
  const usedFiles = []
  deps.forEach(item => {
    usedFiles.push(...item.wxmlDeps, ...item.wxssDeps, ...item.wxsDeps, ...item.esDeps, ...item.jsonDeps)
  })

  // 未使用的文件：wxml & wxss & wxs & js & josn
  const usedFileSet = new Set(usedFiles)
  const unusedFileSet = difference(allFileSet, usedFileSet)

  const unusedCollection = {}
  // 生成 project.config.json 的忽略项
  const projectConfig = {packOptions: {ignore: []}}

  for (let file of unusedFileSet) {
    const ext = path.extname(file).replace('.', '')
    if (!unusedCollection[ext]) unusedCollection[ext] = []
    unusedCollection[ext].push(file)
    projectConfig.packOptions.ignore.push({type: 'file', value: file})
  }
  
  return {
    projectConfig,
    unusedCollection
  }
}


module.exports = {
  findUnusedFiles
}