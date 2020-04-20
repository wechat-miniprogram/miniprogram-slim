# 代码相似度比较

对 `jscpd` 模块的简单封装，默认会在执行的目录下生成一份 `.jscpd.json` 配置文件，`report` 目录保存生成的代码对比报告。

## 用法

```js
// miniprogram-slim cpd -h
sage: miniprogram-slim cpd [options] <dir>

Detect duplications in source code

Options:
  -c, --config [file]  path to config file (default: ".jscpd.json")
  -o, --output [dir]   path to directory for reports (default: "./report/")
  -i, --ignore <glob>  glob pattern for files what should be excluded from duplication detection
  -h, --help           output usage information
```