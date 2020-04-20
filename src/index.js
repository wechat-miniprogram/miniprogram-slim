const program = require('commander')
require('./jscpd')
require('./spritesmith')
require('./imagemin')
require('./depsAnalyzer/index')

const packageJson = require('../package.json')

program
  .version(packageJson.version, '-v, --version', 'output the version number')
  .name('miniprogram-slim')
  .usage('<command>')

program.on('--help', () => {
  console.log('')
  console.log('Examples:')
  console.log('  $ miniprogram-slim analyzer -t')
  console.log('  $ miniprogram-slim cpd src')
  console.log('  $ miniprogram-slim imagemin images/**/*.png')
  console.log('  $ miniprogram-slim sprite -f emoji images/**/*.png')
})

program.parse(process.argv)
