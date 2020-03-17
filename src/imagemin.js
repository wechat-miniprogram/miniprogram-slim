const program = require('commander')
const ora = require('ora')
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')
const imageminGifsicle = require('imagemin-gifsicle')

/**
const normalizePluginOptions = (m, previous = []) => {
  let plugin = m
  let option = {}

  if (m.indexOf('=') >= 0) {
    [plugin, key] = m.split('=')[0].split('.')
    let value = m.split('=')[1]
    if (value.indexOf(',') >= 0) {
      value = value.split(',')
    }
    option[key] = value
  } else if (m.indexOf('.') >= 0) {
    [plugin, key] = m.split('.')
    option[key] = true
  }
  previous.push([plugin, option])
  return previous
}
*/

async function imageminAction(input, cli) {
  const {progressive, output, pngQuality} = cli
  let quality = []
  if (pngQuality) {
    quality = pngQuality.split(',').map(item => parseFloat(item))
  }
  const plugins = [
    imageminJpegtran({
      progressive
    }),
    imageminPngquant({
      verbose: true,
      quality: quality.length === 2 ? quality : [0.6, 0.8]
    }),
    imageminGifsicle({
      interlaced: progressive
    })
  ]
  const spinner = ora('Minifying images')
  if (output) {
		spinner.start()
	}

  let files
  try {
    files = await imagemin(input, {destination: output, plugins})
  } catch (error) {
    spinner.stop()
		throw error
  } 

  if (!output && files.length === 0) {
		return
  }
  
  if (!output && files.length > 1) {
		console.error('Cannot write multiple files to stdout, specify `-o or --output`')
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
  .option('-o, --output <path>', 'output directory')
  .option('--png-quality <string>' , 'instructs pngquant to use the least amount of colors', '0.65,0.8')
  .option('--no-progressive', 'creates baseline JPEG file')
  .action(imageminAction)
