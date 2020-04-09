const path = require('path')
const glob = require('glob')
const fs = require('fs-extra')
const {suffixExtname, removeExtname} = require('./util')

const findAllComponent = (miniprogramRoot) => {
  const jsonFiles = glob.sync('**/*.json', {
    ignore: '**/node_modules/**',
    cwd: miniprogramRoot
  })
  const components = []

  for (let filePath of jsonFiles) {
    const content = fs.readJSONSync(filePath)
    if (content.component === true) {
      components.push(removeExtname(filePath))
    }
  }
  return components
}

// todo 忽略自定义组件中的
const findAllWxml = (miniprogramRoot) => {
  const wxmlFiles = glob.sync('**/*.wxml', {
    ignore: ['**/node_modules/**', '**/miniprogram_npm/**'],
    cwd: miniprogramRoot
  })

  console.log('wxmlFiles', wxmlFiles)
  return wxmlFiles
}

const findAllWxss = (miniprogramRoot) => {
  const wxssFiles = glob.sync('**/*.wxss', {
    ignore: ['**/node_modules/**', '**/miniprogram_npm/**'],
    cwd: miniprogramRoot
  })

  console.log('wxssFiles', wxssFiles)
  return wxssFiles
}

const findAllJs = (miniprogramRoot) => {
  const jsFiles = glob.sync('**/*.js', {
    ignore: ['**/node_modules/**', '**/miniprogram_npm/**'],
    cwd: miniprogramRoot
  })

  console.log('jsFiles', jsFiles)
  return jsFiles
}


module.exports = {
  findAllComponent,
  findAllWxml,
  findAllWxss,
  findAllJs
}