const program = require('commander')
const ora = require('ora')
const cp = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')
const imageminGifsicle = require('imagemin-gifsicle')

async function imageminAction(input, cli) {
  const {
    progressive, output, pngQuality, keepPath
  } = cli
  let quality = []
  if (pngQuality) {
    quality = pngQuality.split(',').map((item) => parseFloat(item))
  }
  const plugins = [
    imageminJpegtran({
      progressive,
    }),
    imageminPngquant({
      verbose: true,
      quality: quality.length === 2 ? quality : [0.6, 0.8],
    }),
    imageminGifsicle({
      interlaced: progressive,
    }),
  ]
  const spinner = ora('Minifying images')
  if (output) {
    spinner.start()
  }

  let files
  try {
    files = await imagemin(input, {
      destination: keepPath ? '' : output,
      plugins,
    })
  } catch (error) {
    spinner.stop()
    throw error
  }
  if (output && keepPath) {
    files.forEach((file) => {
      const {base, dir} = path.parse(file.sourcePath)
      const outputDir = path.join(output, dir.slice(dir.indexOf('/') + 1))
      cp.execSync(`mkdir -p ${outputDir}`)
      fs.writeFileSync(path.join(outputDir, base), file.data)
    })
  }

  if (!output && files.length === 0) {
    return
  }

  if (!output && files.length > 1) {
    console.error(
      'Cannot write multiple files to stdout, specify `-o or --output`'
    )
    process.exit(1)
  }

  if (!output) {
    process.stdout.write(files[0].data)
    return
  }

  spinner.stop()
  console.log(`${files.length} images minified`)
}

program
  .command('imagemin <input...>')
  .description('Minify images seamlessly')
  .option('-o, --output <dir>', 'output directory')
  .option(
    '--png-quality <string>',
    'instructs pngquant to use the least amount of colors',
    '0.65,0.8'
  )
  .option('--no-progressive', 'creates baseline JPEG file')
  .option('--keep-path', 'output files keep relative path')
  .action(imageminAction)
