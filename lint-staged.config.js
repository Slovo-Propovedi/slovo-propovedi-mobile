/** @type {import('lint-staged').Configuration} */
const config = {
  'src/**/*.{js?(x),ts?(x),?(s)css}': ['eslint --fix', 'prettier --write --ignore-unknown'],
  'src/**/*.{json,html}': ['prettier --write --ignore-unknown'],
}

export default config
