const program = require('commander')
const fs = require('fs-extra')
const path = require('path')
const Spritesmith = require('spritesmith')
const CleanCSS = require('clean-css')

const parseInt = (value) => parseInt(value)

const spriteAction = (input, cli) => {
  const {filename, padding, output} = cli
  Spritesmith.run({
    src: input,
    padding
  }, (err, result) => {
    if (err) {
      console.error(`Failed to construct sprite map: ${err}`)
      return
    }

    const {coordinates, image: buffer} = result
    const styles = []
    const classNames = []
    // eslint-disable-next-line guard-for-in
    for (const key in coordinates) {
      const box = coordinates[key]
      const basename = path.basename(key).split('.')[0]
      const className = `.${basename}`
      classNames.push(className)

      styles.push(`
        ${className} {
          width: ${box.width}px;
          height: ${box.height}px;
          background-position: ${-box.x}px ${-box.y}px;
        }`)
    }

    styles.unshift(`
      ${classNames.join(',')} {
        display: inline-block;
        background-repeat: no-repeat;
        background-image: url("./${filename}.png");
      }
    `)

    styles.unshift('/*!-----The css code below is created by----*/')

    const spritesheet = styles.join('\n')
    const prettySpritesheet = new CleanCSS({
      format: 'beautify'
    }).minify(spritesheet).styles

    const directory = path.resolve(output)
    fs.ensureDirSync(directory)
    fs.writeFileSync(path.resolve(directory, `${filename}.css`), prettySpritesheet)
    fs.writeFileSync(path.resolve(directory, `${filename}.png`), buffer)
  })
}

program
  .command('sprite <input...>')
  .description('Covert images into css sprites')
  .option('-o, --output [dir]', 'output directory', './')
  .option('-f, --filename [string]', 'filename of spritesheet', 'sprite')
  .option('-p, --padding [number]', 'padding to use between images', parseInt, 2)
  .action(spriteAction)
