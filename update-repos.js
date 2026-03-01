const { Octokit } = require('@octokit/rest');
const fs = require('fs');

const username = 'JeraldPascual';
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getActiveRepos() {
  const { data } = await octokit.repos.listForUser({
    username,
    sort: 'pushed',
    per_page: 6,
    type: 'owner',
  });

  return data
    .filter(r => !r.fork && !r.archived && r.name !== username)
    .slice(0, 6)
    .map(r => ({
      name: r.name,
      url: r.html_url,
      description: r.description || '',
      language: r.language || '',
      stars: r.stargazers_count,
      forks: r.forks_count,
    }));
}

function generateRepoCards(repos) {
  if (repos.length === 0) return 'No active repositories found.';

  const languageColor = {
    JavaScript: 'F7DF1E',
    TypeScript: '3178C6',
    Python: '3776AB',
    HTML: 'E34F26',
    CSS: '1572B6',
    Java: 'ED8B00',
  };

  let cards = '<div align="center">\n\n';

  for (const repo of repos) {
    cards += `<a href="${repo.url}">\n  <img src="https://github-readme-stats.vercel.app/api/pin/?username=${username}&repo=${repo.name}&theme=dark&hide_border=true&bg_color=0D1117&title_color=58A6FF&icon_color=58A6FF&text_color=C9D1D9" />\n</a>\n`;
  }

  cards += '\n</div>';
  return cards;
}

function updateReadme(content, section, replacement) {
  const start = `<!--START_SECTION:${section}-->`;
  const end = `<!--END_SECTION:${section}-->`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`, 'g');
  return content.replace(re, `${start}\n${replacement}\n${end}`);
}

async function main() {
  const repos = await getActiveRepos();
  const cards = generateRepoCards(repos);

  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  });

  let readme = fs.readFileSync('README.md', 'utf8');
  readme = updateReadme(readme, 'repos', cards);
  readme = updateReadme(readme, 'update_time', now);
  fs.writeFileSync('README.md', readme);

  console.log(`README updated with ${repos.length} repos — ${now}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
