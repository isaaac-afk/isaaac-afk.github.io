import { defineConfig } from 'astro/config';
// GitHub Actions supplies the destination; local previews remain at localhost /.
const [owner, repository] = (process.env.GITHUB_REPOSITORY || '').split('/');
const pages = process.env.GITHUB_ACTIONS === 'true' && owner && repository;
export default defineConfig({
 output:'static',
 site:pages ? `https://${owner}.github.io` : undefined,
 base:pages && repository.toLowerCase() !== `${owner.toLowerCase()}.github.io` ? `/${repository}/` : '/',
 trailingSlash:'always',
 server:{host:'127.0.0.1',port:4324},
});
