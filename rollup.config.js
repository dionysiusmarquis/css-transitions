import babel from 'rollup-plugin-babel'
import buble from 'rollup-plugin-buble'
import cleanup from 'rollup-plugin-cleanup'
import commonjs from 'rollup-plugin-commonjs'
import strip from 'rollup-plugin-strip'
import eslint from 'rollup-plugin-eslint'
import uglify from 'rollup-plugin-uglify'
import nodeResolve from 'rollup-plugin-node-resolve'

const pluginsBase = [
  nodeResolve(
    {
      browser: true,
      jsnext: true,
      module: true
    }
  ),

  commonjs(),

  eslint({
    throwError: true
  }),

  cleanup()
]

const pluginsPre = [
  strip({
    functions: ['console.log']
  })
]

const pluginsLegacy = [
  babel({
    runtimeHelpers: true,
    externalHelpers: true,
    exclude: 'node_modules/**'
  })
]

const pluginsCjs = [
  buble({
    transforms: {
      forOf: false
    }
  })
]

const pluginsPost = [
  uglify()
]

function config (build) {
  let dest = 'dist/css-transitions.es.js'
  let format = 'es'
  let plugins = []
  let external = Object.keys(require('./package.json').dependencies)

  switch (build) {
    case 'dev':
      break
    case 'cjs':
      dest = 'dist/css-transitions.cjs.js'
      format = 'cjs'
      plugins = [...pluginsPre, ...pluginsCjs]
      break
    case 'ugly':
      dest = 'dist/css-transitions.min.js'
      format = 'iife'
      plugins = [...pluginsPre, ...pluginsLegacy, ...pluginsPost]
      external = []
      break
  }

  return {
    entry: 'src/css-transitions.js',
    dest,
    moduleName: 'css-transitions',
    format,
    exports: 'named',
    plugins: [
      ...pluginsBase,
      ...plugins
    ],
    external
  }
}

let buildArgIndex = process.argv.indexOf('--build')
let build = process.argv[buildArgIndex + 1]

if (build) console.log('Build:', build)
export default config(build)
