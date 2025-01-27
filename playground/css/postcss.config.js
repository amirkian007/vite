module.exports = {
  plugins: [require('postcss-nested'), testDirDep, testSourceInput]
}

const fs = require('fs')
const path = require('path')
const glob = require('fast-glob')
const { normalizePath } = require('vite')

/**
 * A plugin for testing the `dir-dependency` message handling.
 */
function testDirDep() {
  return {
    postcssPlugin: 'dir-dep',
    AtRule(atRule, { result, Comment }) {
      if (atRule.name === 'test') {
        const pattern = normalizePath(
          path.resolve(path.dirname(result.opts.from), './glob-dep/**/*.css')
        )
        const files = glob.sync(pattern)
        const text = files.map((f) => fs.readFileSync(f, 'utf-8')).join('\n')
        atRule.parent.insertAfter(atRule, text)
        atRule.remove()

        result.messages.push({
          type: 'dir-dependency',
          plugin: 'dir-dep',
          dir: './glob-dep',
          glob: '*.css',
          parent: result.opts.from
        })

        result.messages.push({
          type: 'dir-dependency',
          plugin: 'dir-dep',
          dir: './glob-dep/nested (dir)', // includes special characters in glob
          glob: '*.css',
          parent: result.opts.from
        })
      }
    }
  }
}
testDirDep.postcss = true

function testSourceInput() {
  return {
    postcssPlugin: 'source-input',
    AtRule(atRule) {
      if (atRule.name === 'source-input') {
        atRule.after(
          `.source-input::before { content: ${JSON.stringify(
            atRule.source.input.from
          )}; }`
        )
        atRule.remove()
      }
    }
  }
}
testSourceInput.postcss = true
