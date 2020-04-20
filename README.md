# 小程序瘦身工具

通过剔除无用文件、压缩图片、复用代码等方式减少小程序代码包体积。

## 功能

* [依赖分析，查找无用文件](./docs/deps.md)
* [代码相似度比较](./docs/jscpd.md)
* [生成雪碧图代码](./docs/sprite.md)
* [图片压缩](./docs/imagemin.md)

## 安装

```js
npm install -g miniprogram-slim
```

## 使用

```js
Usage: miniprogram-slim <command>

Options:
  -v, --version                  output the version number
  -h, --help                     output usage information

Commands:
  cpd [options] <dir>            Detect duplications in source code
  sprite [options] <input...>    Covert images into css sprites
  imagemin [options] <input...>  Minify images seamlessly
  analyzer [options]             Analyze dependencies of miniprogram, find out unused files

Examples:
  $ miniprogram-slim analyzer -t
  $ miniprogram-slim cpd src
  $ miniprogram-slim imagemin images/**/*.png
  $ miniprogram-slim sprite -f emoji images/**/*.png
```