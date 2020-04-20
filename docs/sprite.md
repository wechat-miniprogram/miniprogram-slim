# 生成雪碧图代码

对 `spritesmith` 模块的简单封装，能够自动生成雪碧图和对应的 `css` 代码。

## 用法

```js
// miniprogram-slim sprite -h
Usage: miniprogram-slim sprite [options] <input...>

Covert images into css sprites

Options:
  -o, --output [dir]       output directory (default: "./")
  -f, --filename [string]  filename of spritesheet (default: "sprite")
  -p, --padding [number]   padding to use between images (default: 2)
  -h, --help               output usage information
```