const fs = require('fs-extra')
const chalk = require('chalk').default
const {stripIndent, oneLineCommaListsAnd, oneLine} = require('common-tags')
const semver = require('semver')

const commitMessagePath = process.argv[2]
const commitMessageRaw = fs.readFileSync(commitMessagePath, {encoding: 'utf8'})

// Remove comments in the commit message.
// This happens after rebasing or merging when the message is changed.
const commitMessageWithoutComments = commitMessageRaw
  .split('\n')
  .map(line => line.startsWith('#') ? null : line)
  .filter(Boolean)
  .join('\n')
  .replace(/\n+/g, '\n')

// Strip the trailing \n if exists, otherwise don't meddle.
const commitMessage = commitMessageWithoutComments.endsWith('\n')
  ? commitMessageWithoutComments.slice(0, -1)
  : commitMessageWithoutComments

const ALLOWED_SCOPES = {
  'feat': [
    'cli',
    'compiler',
    'dev-server',
    '*',
  ],
  'fix': [
    'cli',
    'compiler',
    'dev-server',
    '*',
  ],
  'test': [
    'unit',
    'int',
    'e2e',
    '*',
  ],
  'docs': [
    'readme',
    '*',
  ],
  'devops': [
    'git',
    '*',
  ],
}

const ALLOWED_TYPES = Object.keys(ALLOWED_SCOPES)

const REGEX_CLOSE_MANDATORY = /^(?<type>.+)\((?<scope>.+?)\): (?<message>.+) \(close #(?<issue>\d+)\)$/u
const REGEX_CLOSE_OPTIONAL = /^(?<type>.+)\((?<scope>.+?)\): (?<message>.+)(?: \(close #(?<issue>\d+)\))?$/u

// "yarn publish" will create a commit with a message of semver prepended with "v",
// so we first check for this format.
if (commitMessage.startsWith('v')) {
  const version = semver.valid(commitMessage.slice(1))
  if (version != null) {
    console.info(chalk.green(`This is a ${chalk.bold(version)} release commit.`))
    process.exit(0)
  }
}

if (!REGEX_CLOSE_OPTIONAL.test(commitMessage)) {
  console.error(chalk.red(`Commit message "${chalk.bold(commitMessage)}" is in wrong format.`))
  const msg = stripIndent`
    Examples of proper messages:
      feat(cli): support configuration file (close #3)
      fix(compiler): do not break when a negative number is used
  `
  console.info(chalk.gray(msg))
  process.exit(1)
}

if (!REGEX_CLOSE_MANDATORY.test(commitMessage)) {
  console.warn(chalk.yellow(`Missing "(closes #xxx)" at the end of the commit message.`))
}

const {groups: {type, scope, message, issue}} = REGEX_CLOSE_OPTIONAL.exec(commitMessage)

// Collect errors

const errors = {
  type: false,
  scope: false,
  message: false,
  issue: false,
}

if (!ALLOWED_TYPES.includes(type)) {
  errors.type = true
}

if (!errors.type) {
  const allowedScopes = ALLOWED_SCOPES[type]
  if (!allowedScopes.includes(scope)) {
    errors.scope = true
  }
}

if (message == null || message.trim().length === 0) {
  errors.message = true
}

// Report errors

if (errors.type) {
  console.error(chalk.red(oneLineCommaListsAnd`Unknown type "${chalk.bold(type)}".
    Supported types: ${ALLOWED_TYPES}.`))
}

if (errors.scope) {
  console.error(chalk.red(oneLineCommaListsAnd`Unknown scope "${chalk.bold(scope)}"
    for this type. Supported scopes for ${scope}: ${ALLOWED_SCOPES[type]}.`))
}

if (errors.message) {
  console.error(chalk.red(oneLineCommaListsAnd`The message cannot be empty.`))
}

// If there are no errors, clean exit. Otherwise, scream.

if (!Object.values(errors).some(e => e)) {
  console.log(chalk.green(oneLine`Commit message ${chalk.bold(commitMessage)} is good.`))
  process.exit(0)
} else {
  process.exit(1)
}
