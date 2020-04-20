const path = require('path')
const inspect = require('util').inspect
const Table = require('cli-table3')
const colors = require('colors')


const createLog = (module) => {
  const manager = require('simple-node-logger').createLogManager({
    timestampFormat: 'YYYY-MM-DD HH:mm:ss'
  })
  const log = manager.createLogger(module)
  return log
}

const suffixExtname = (filePath, ext = 'js') => {
  const sep = path.sep
  const {dir, name} = path.parse(filePath)
  return dir ? `${dir}${sep}${name}.${ext}` : `${name}.${ext}`
}

const removeExtname = (filePath) => {
  const sep = path.sep
  const {dir, name} = path.parse(filePath)
  return dir ? `${dir}${sep}${name}` : `${name}`
}

const unique = (arr = []) => Array.from(new Set(arr))

const printObject = (Object) => {
  console.log(inspect(Object, {showHidden: false, depth: null}))
}

const genPackOptions = (unusedFiles, pluginRoot) => {
  const map = {}
  unusedFiles.forEach(file => {
    if (pluginRoot) {
      file = path.join(pluginRoot, file)
    }
    const ext = path.extname(file).replace('.', '')
    const name = removeExtname(file)
    if (!map[name]) map[name] = []
    map[name].push(ext)
  })
  const packOptions = {ignore: []}
  Object.keys(map).forEach(name => {
    const exts = map[name]
    if (exts.length === 1) {
      packOptions.ignore.push({
        type: 'file',
        value: `${name}.${exts[0]}`
      })
    } else if (exts.length > 1) {
      packOptions.ignore.push({
        type: 'glob',
        value: `${name}.@(${exts.join('|')})`
      })
    }
  })
  return packOptions
}

const drawTable = (data) => {
  const items = [
    ...data.pages.children,
    ...data.subpackages.children
  ]
  items.sort((a, b) => b.size - a.size)
  items.unshift(data.app)

  const table = new Table({
    head: ['page', 'file & comp', 'stat size (kB)', 'percent', 'totalSize (kB)'],
    style: {}
  })


  items.forEach(item => {
    const name = item.name
    const totalSize = item.size
    const pages = item.children[0].children || []
    const components = item.children[1].children || []
    const rows = pages.length + components.length
    table.push([{
      rowSpan: rows,
      content: name,
      vAlign: 'center'
    }, {
      content: pages[0].absolutePath
    }, {
      content: pages[0].size
    }, {
      content: (pages[0].size / totalSize * 100).toFixed(2) + '%'
    }, {
      rowSpan: rows,
      content: totalSize,
      vAlign: 'center'
    }])

    for (let i = 1; i < pages.length; i++) {
      table.push([{
        content: pages[i].absolutePath
      }, {
        content: pages[i].size
      }, {
        content: (pages[i].size / totalSize * 100).toFixed(2) + '%'
      }])
    }

    for (let i = 0; i < components.length; i++) {
      table.push([{
        content: colors.green(components[i].absolutePath)
      }, {
        content: components[i].size
      }, {
        content: (components[i].size / totalSize * 100).toFixed(2) + '%'
      }])
    }
  })
  console.log(table.toString())
}

module.exports = {
  suffixExtname,
  removeExtname,
  createLog,
  unique,
  printObject,
  genPackOptions,
  drawTable
}
