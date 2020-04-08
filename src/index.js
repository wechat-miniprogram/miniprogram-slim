#!/usr/bin/env node
const program = require('commander')
require('./jscpd')
require('./spritesmith')
require('./imagemin')
require('./depsAnalyzer/index')

const packageJson = require('../package.json')
program
  .version(packageJson.version, '-v, --version', 'output the version number')
  .name('slim')
  .usage('<command>')

program.parse(process.argv)

