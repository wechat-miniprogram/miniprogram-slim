const path = require('path')
const glob = require('glob')
const fs = require('fs-extra')
const {difference} = require('./setOperation')
const {analyzeComponent, computeComponentSize} = require('../handler/analyzerComp')
const {findAbsolutePath} = require('../handler/util')

const defaultIgnores = [
  '**/node_modules/**',
  'project.config.json',
  '**/sitemap.json'
]

const findAllComponent = () => {
  const jsonFiles = glob.sync('**/*.json', {ignore: [...defaultIgnores]})
  const components = new Set()

  for (const filePath of jsonFiles) {
    const content = fs.readJSONSync(filePath)
    if (content.component === true) {
      components.add(filePath)
    }

    if (content.usingComponents) {
      const usingComps = Object.values(content.usingComponents)
      usingComps.forEach(comp => {
        if (!comp.startsWith('plugin://')) {
          const compPath = findAbsolutePath({
            filePath,
            relativePath: comp,
            ext: 'json'
          })
          if (compPath) components.add(compPath)
        }
      })
    }
  }
  return Array.from(components)
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
    const basename = path.basename(file)
    allFileInfo[file] = {
      name,
      ext,
      size,
      basename
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

const findAllComponentDeps = (allFileInfo) => {
  const components = findAllComponent()
  const componentDeps = {}
  components.forEach(comp => {
    const deps = analyzeComponent(comp)
    const size = computeComponentSize(deps, allFileInfo)
    deps.size = size
    componentDeps[comp] = deps
  })
  return componentDeps
}

const findUnusedFiles = ({
  allFileInfo,
  componentDeps,
  dependencies,
  ignore
}) => {
  // 所有文件
  const allFiles = Object.keys(allFileInfo)
  const allFileSet = new Set(allFiles)

  const {app, pages, subpackages} = dependencies
  const deps = [app, ...Object.values(pages), ...Object.values(subpackages)]
  const usedCompSet = new Set()
  deps.forEach(item => {
    item.compDeps.forEach(comp => usedCompSet.add(comp))
  })
  usedCompSet.forEach(comp => {
    if (componentDeps[comp]) {
      deps.push(componentDeps[comp])
    }
  })
  // 未使用的组件
  // const allCompSet = new Set(components)
  // const unusedCompSet = difference(allCompSet, usedCompSet)

  // 已使用的文件
  const usedFiles = []
  deps.forEach(item => {
    usedFiles.push(...item.files)
  })
  const usedFileSet = new Set(usedFiles)
  const ignoreFiles = findIgnoreFils(ignore)
  const ignoreFileSet = new Set(ignoreFiles)

  // 未使用的文件
  let unusedFileSet = difference(allFileSet, usedFileSet)
  unusedFileSet = difference(unusedFileSet, ignoreFileSet)

  const unusedFiles = Array.from(unusedFileSet)
  return unusedFiles
}

module.exports = {
  findUnusedFiles,
  findAllComponentDeps,
  findAllFileInfo
}
