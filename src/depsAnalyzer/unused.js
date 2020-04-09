const path = require('path')
const glob = require('glob')
const fs = require('fs-extra')
const {removeExtname} = require('./util')
const {difference} = require('./setOperation')
const {analyzeComponent} = require('./analyzerComp')

const findAllComponent = (miniprogramRoot) => {
  const jsonFiles = glob.sync('**/*.json', {
    ignore: '**/node_modules/**',
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
const findAllFiles = (miniprogramRoot) => {
  const allFiles = []
  const exts = ['wxml', 'wxss', 'wxs', 'js']
  exts.forEach(ext => {
    const files = glob.sync(`**/*.${ext}`, {
      ignore: ['**/node_modules/**'],
      cwd: miniprogramRoot
    })
    const realPathFile = files.map(file => path.join(miniprogramRoot, file))
    allFiles.push(...realPathFile)
  })
  return allFiles
}

const findUnusedFiles = (miniprogramRoot, appDeps) => {
  const components = findAllComponent(miniprogramRoot)
  const componentDeps = {}
  components.forEach(comp => {componentDeps[comp] = analyzeComponent(comp)})

  const {app, pages, subpackages} = appDeps
  const deps = [app, ...Object.values(pages), ...Object.values(subpackages)]
  const usedCompSet = new Set()
  deps.forEach(item => {
    item.compDeps.forEach(comp => usedCompSet.add(comp))
  })
  usedCompSet.forEach(comp => {deps.push(componentDeps[comp])})

  // 未使用的组件
  const allCompSet = new Set(components)
  const unusedCompSet = difference(allCompSet, usedCompSet)
  const allCompFiles = []
  Object.values(componentDeps).forEach(item => {
    allCompFiles.push(...item.wxmlDeps, ...item.wxssDeps, ...item.wxsDeps, ...item.esDeps)
  })
  const allCompFileSet = new Set(allCompFiles)

  // 所有文件
  let allFiles = findAllFiles(miniprogramRoot)
  let allFilesExceptComp = allFiles.filter(file => !allCompFileSet.has(file))

  const allFileExceptCompSet = new Set(allFilesExceptComp)

  // 已使用的文件
  const usedFiles = []
  deps.forEach(item => {
    usedFiles.push(...item.wxmlDeps, ...item.wxssDeps, ...item.wxsDeps, ...item.esDeps)
  })

  // 未使用的文件：wxml & wxss & wxs & js
  const usedFileSet = new Set(usedFiles)
  const unusedFileSet = difference(allFileExceptCompSet, usedFileSet)

  const result = {}
  for (let file of unusedFileSet) {
    const ext = path.extname(file).replace('.', '')
    if (!result[ext]) result[ext] = []
    result[ext].push(file)
  }
  result.comp = Array.from(unusedCompSet)
  return result
}


module.exports = {
  findUnusedFiles
}