import { Router } from 'express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

const router = Router();

function about() {
  const authorEnv = process.env.AUTHOR;
  const repoEnv = process.env.GITHUB_URL;

  const authorPkg =
    typeof pkg.author === 'string' ? pkg.author : pkg.author?.name || '';

  let repoPkg = '';
  if (typeof pkg.repository === 'string') repoPkg = pkg.repository;
  else if (pkg.repository?.url) repoPkg = pkg.repository.url;

  const githubUrl = (repoEnv || repoPkg || '')
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '');

  return {
    status: 'ok',
    author: authorEnv || authorPkg || 'Unknown',
    githubUrl: githubUrl || '',
    version: pkg.version || '0.0.0',
  };
}

function noCache(res) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
}

router.get('/', (req, res) => {
  noCache(res);
  return res.status(200).json(about());
});

export default router;