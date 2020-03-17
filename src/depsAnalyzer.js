const fs = require('fs-extra')
const ora = require('ora')
const path = require('path')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const program = require('commander')
const glob = require('glob')
const {difference} = require('./setOperation')

const suffixExtname = (filePath, ext = 'js') => {
  return path.extname(filePath) 
    ? filePath 
    : `${filePath}.${ext}`
}

const moduleAnalyser = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8')
  const ast = parser.parse(content, {
    sourceType: 'module'
  })
  const deps = {}
  traverse(ast, {
    ImportDeclaration({ node }) {
      const dirname = path.dirname(filePath)
      const depFilePath = path.join(dirname, node.source.value)
      deps[node.source.value] = suffixExtname(depFilePath)
    }
  })
  return {
    filePath,
    deps,
  }
}

const genDepsGraph = (entry) => {
  const entryModule = moduleAnalyser(entry)
  const deps = entryModule.deps
  const depsGraph = {[entry]: deps}

  Object.values(deps).forEach(filePath => {
    Object.assign(depsGraph, genDepsGraph(filePath))
  })
  return depsGraph
}

const genAppDepsGraph = () => {
  const appJsonPath = `./app.json`

  const appJson = fs.readJSONSync(appJsonPath)
  const entrys = appJson.pages
  const graphs = entrys.map(entry => {
    return genDepsGraph(suffixExtname(entry))
  })

  // const usedJsArray= []
  // graphs.forEach(graph => {
  //   usedJsArray.push(...Object.keys(graph))
  // })
  // console.log('Used Js Files: ')
  // console.log(result.join('\n'))
  
  return graphs
}

program
  .command('analyzer <app>')
  .description('Analyze dependencies of source code')
  .action(genAppDepsGraph)