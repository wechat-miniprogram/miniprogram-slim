const genPageCompData = (comps = [], componentDeps) => {
  let totalSize = 0
  const children = []
  for (const comp of comps) {
    totalSize += componentDeps[comp].size
    const compName = comp.slice(comp.lastIndexOf('/') + 1)
    children.push({
      name: compName,
      size: componentDeps[comp].size,
      absolutePath: comp
    })
  }
  children.sort((a, b) => b.size - a.size)

  return {
    name: 'components',
    size: +totalSize.toFixed(2),
    children
  }
}

const genFileData = (file, allFileInfo) => {
  const fileInfo = allFileInfo[file]
  return {
    name: fileInfo.basename,
    size: fileInfo.size,
    absolutePath: file
  }
}

const genPageData = ({name, pageDeps, componentDeps, allFileInfo}) => {
  const comps = pageDeps.compDeps
  const compData = genPageCompData(comps, componentDeps)

  const children = []
  let totalSize = 0
  const files = pageDeps.files.sort()
  files.forEach(file => {
    const fileData = genFileData(file, allFileInfo)
    children.push(fileData)
    totalSize += fileData.size
  })
  children.sort((a, b) => b.size - a.size)

  const pages = {
    name: 'pages',
    size: +totalSize.toFixed(2),
    children
  }

  return {
    name,
    size: +(pages.size + compData.size).toFixed(2),
    children: [pages, compData]
  }
}

const genModuleData = ({pages, componentDeps, allFileInfo}) => {
  const children = []
  let pagesTotalSize = 0
  for (const page of Object.keys(pages)) {
    const pageData = genPageData({
      name: page,
      componentDeps,
      allFileInfo,
      pageDeps: pages[page]
    })
    children.push(pageData)
    pagesTotalSize += pageData.size
  }
  children.sort((a, b) => b.size - a.size)

  return {
    children,
    size: +pagesTotalSize.toFixed(2)
  }
}

const genData = ({dependencies, componentDeps, allFileInfo}) => {
  const {app, pages, subpackages} = dependencies
  const data = {
    app: {
      name: 'app',
      size: 0,
      children: []
    },
    pages: {
      name: 'pages',
      size: 0,
      children: []
    },
    subpackages: {
      name: 'subpackages',
      size: 0,
      children: []
    }
  }

  const appData = genModuleData({
    pages: {app},
    componentDeps,
    allFileInfo
  })

  data.app = appData.children[0]
  data.pages = Object.assign(data.pages, genModuleData({
    pages,
    componentDeps,
    allFileInfo
  }))

  data.subpackages = Object.assign(data.subpackages, genModuleData({
    pages: subpackages,
    componentDeps,
    allFileInfo
  }))

  // if (!data.subpackages.size) delete data.subpackages
  // if (!data.pages.size) delete data.pages
  // if (!data.app.size) delete data.app
  
  return data
}

module.exports = {
  genData
}