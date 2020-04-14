const program = require('commander')
const shell = require('shelljs')
const fs = require('fs-extra')
const {resolve} = require('path')

const path2JscpdJson = resolve(__dirname, '../config/jscpd.json')
const path2JscpdBin = resolve(__dirname, '../node_modules/jscpd/bin/jscpd')
const jscpdAction = (dir, cli) => {
  let config = cli.config ? resolve(cli.config) : '.jscpd.json'
  if (!fs.existsSync(config)) {
    fs.copySync(path2JscpdJson, config)
  }
  const ignore = cli.ignore ? `-i ${cli.ignore} ` : ''
  const command = `${path2JscpdBin} -c ${config} -o ${cli.output} ${ignore} ${cli.blame ? '-b ' : ''} ${dir} `
  shell.exec(command)
}

program
  .command('cpd <dir>')
  .description('Detect duplications in source code')
  .option('-c, --config [file]', 'path to config file', '.jscpd.json')
  .option('-o, --output [path]', 'path to directory for reports', './report/')
  .option('-i, --ignore <glob>', 'glob pattern for files what should be excluded from duplication detection')
  .action(jscpdAction)