# 小程序瘦身工具

## 安装

`npm i` 安装依赖后执行 `npm lint` 会注册全局指令 `slim`，通过 `slim -h` 查看具体用法。

```
Usage: slim <command>

Options:
  -v, --version                  output the version number
  -h, --help                     output usage information

Commands:
  cpd [options] <dir>            Detect duplications in source code
  sprite [options] <input...>    Covert images into css sprites
  imagemin [options] <input...>  Minify images seamlessly
  analyzer [entry]               Analyze dependencies of source code
```

## 功能

* 检测相似文件 `slim cpd -h`
* 生成雪碧图代码  `slim sprite -h`
* 图片压缩 `slim imagemin -h`
* 文件依赖分析，查找无用文件 `slim analyzer -h`

### 文件依赖分析

```js
Usage: slim analyzer [options] [entry]

Analyze dependencies of source code

Options:
  -o, --output [path]  path to file for analyzer (default:"./depsAnalyzer.json")
  -i, --ignore <glob>  glob pattern for files what should be excluded
  -h, --help           output usage information
```

入口文件为 `app.json` 或 `plugin.json` 的路径，对小程序/插件实际使用到的 `wxml`、`wxss`、`wxs`、`js`、`json` 以及组件进行依赖分析。

`js` 文件的依赖，支持 `import` 和 `require` 导入的模块，但运行时计算的路径如 `require(a + b)` 将被忽略。

```js
slim analyzer -i "miniprogram_npm" app.json
```

#### 文件依赖结构

```js
appDependencies = {
  app: {
    esDeps: [],
    wxmlDeps: [],
    wxssDeps: [],
    compDeps: [],
    wxsDeps: [],
    jsonDeps: []
  },
  pages: {
    <!-- key 为 page 路径 -->
  },
  subpackages: {
    <!-- key 为 page 路径 -->
  }
}
```

#### 无用文件结构

```js
unusedCollection = {
  js: [],
  comps: [],
  wxml: [],
  wxs: [],
  wxss: [],
  json: []
}
```

#### 可能的用途

* 去除无用文件，减少体积
* 分析文件大小，进行拆分，优化代码结构
* 文件改动时，查找影响到的页面/组件，明确影响范围方便测试

## todo
 
展示优化