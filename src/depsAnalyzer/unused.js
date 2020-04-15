const path = require('path')
const glob = require('glob')
const fs = require('fs-extra')
const {removeExtname, printObject} = require('./util')
const {difference} = require('./setOperation')
const {analyzeComponent, computeComponentSize} = require('./analyzerComp')

const defaultIgnores = [
  '**/node_modules/**',
  '**/package.json',
  '**/package-lock.json',
  'project.config.json',
  '**/sitemap.json'
]

const findAllComponent = () => {
  const jsonFiles = glob.sync('**/*.json', {ignore: [...defaultIgnores]})
  const components = []

  for (let filePath of jsonFiles) {
    const content = fs.readJSONSync(filePath)
    if (content.component === true) {
      components.push(removeExtname(filePath))
    }
  }
  return components
}

const findAllFileInfo = () => {
  const exts = ['wxml', 'wxss', 'wxs', 'js', 'json'].join('|')
  const allFiles = glob.sync(`**/*.@(${exts})`, {
    ignore: [...defaultIgnores]  
  })
  const allFileInfo = {}
  allFiles.forEach(file => {
    const size = +(fs.statSync(file).size / 1000).toFixed(2) // kB
    const ext = path.extname(file)
    const name = path.basename(file, ext)
    allFileInfo[file] = {
      name,
      ext,
      size
    }
  })
  return allFileInfo
}

const findIgnoreFils = (ignore = []) => {
  const ignoreFiles = []
  ignore.forEach(pattern => {
    const files = glob.sync(pattern, {ignore: [...defaultIgnores]})
    ignoreFiles.push(...files)
  })
  const uniqueIgnoreFiles = Array.from(new Set(ignoreFiles))
  return uniqueIgnoreFiles
}

const findUnusedFiles = ({dependencies, ignore}) => {
  // 所有文件
  const allFileInfo = findAllFileInfo()
  const allFiles = Object.keys(allFileInfo)
  const allFileSet = new Set(allFiles)

  const components = findAllComponent()
  const componentDeps = {}
  const componentSizes = {}
  components.forEach(comp => {
    componentDeps[comp] = analyzeComponent(comp)
    componentSizes[comp] = computeComponentSize(componentDeps[comp], allFileInfo)
  })

  const {app, pages, subpackages} = dependencies
  const deps = [app, ...Object.values(pages), ...Object.values(subpackages)]
  const usedCompSet = new Set()
  deps.forEach(item => {
    item.compDeps.forEach(comp => usedCompSet.add(comp))
  })
  usedCompSet.forEach(comp => {
    if (!componentDeps[comp]) {
      componentDeps[comp] = analyzeComponent(comp)
    }
    componentDeps[comp] && deps.push(componentDeps[comp])
  })
  // // 未使用的组件
  // const allCompSet = new Set(components)
  // const unusedCompSet = difference(allCompSet, usedCompSet)
  // const allCompFiles = []
  // components.forEach(item => {
  //   allCompFiles.push(...item.wxmlDeps, ...item.wxssDeps, ...item.wxsDeps, ...item.esDeps, ...item.jsonDeps)
  // })
  // const allCompFileSet = new Set(allCompFiles)

  // const allFilesExceptComp = allFiles.filter(file => !allCompFileSet.has(file))
  // const allFileExceptCompSet = new Set(allFilesExceptComp)

  // 已使用的文件
  const usedFiles = []
  deps.forEach(item => {
    usedFiles.push(...item.files)
  })
  const usedFileSet = new Set(usedFiles)
  const ignoreFiles= findIgnoreFils(ignore)
  const ignoreFileSet = new Set(ignoreFiles)

  // 未使用的文件
  let unusedFileSet = difference(allFileSet, usedFileSet)
  unusedFileSet = difference(unusedFileSet, ignoreFileSet)

  const unusedFiles = Array.from(unusedFileSet)
  return unusedFiles
}

module.exports = {
  findUnusedFiles
}