const PROJECT_CONFIG_PATH = 'project.config.json'
const MINIPROGRAM_NPM_PATH = 'miniprogram_npm/'

const DEFAULT_IGNORES = [
  '**/node_modules/**',
  PROJECT_CONFIG_PATH,
  '**/sitemap.json',
]

const VALID_EXTS = ['wxml', 'wxss', 'wxs', 'js', 'json']

module.exports = {
  PROJECT_CONFIG_PATH,
  MINIPROGRAM_NPM_PATH,
  DEFAULT_IGNORES,
  VALID_EXTS,
}
