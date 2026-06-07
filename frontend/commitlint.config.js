export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'test', 'perf', 'ci', 'revert'
    ]],
    'scope-empty': [1, 'never'],
    'subject-min-length': [2, 'always', 10],
  },
};
