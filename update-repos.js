const { Octokit } = require('@octokit/rest');
const fs = require('fs');

const username = 'JeraldPascual';
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function getActiveRepos() {
  const { data } = await octokit.repos.listForUser({
    username,
    sort: 'pushed',
    per_page: 20,
    type: 'owner',
  });

  return data
    .filter(r => !r.fork && !r.archived && r.name !== username)
    .slice(0, 6)
    .map(r => ({
      name: r.name,
      url: r.html_url,
      description: r.description || 'No description provided.',
      language: r.language || 'N/A',
      stars: r.stargazers_count,
      forks: r.forks_count,
      updatedAt: new Date(r.pushed_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    }));
}

const languageColor = {
  JavaScript: 'F7DF1E',
  TypeScript: '3178C6',
  Python: '3776AB',
  HTML: 'E34F26',
  CSS: '1572B6',
  Java: 'ED8B00',
};

function generateRepoCards(repos) {
  if (repos.length === 0) return '_No active repositories found._';

  const rows = repos.map(r => {
    const color = languageColor[r.language] || '808080';
    const langBadge = r.language !== 'N/A'
      ? `![${r.language}](https://img.shields.io/badge/-${encodeURIComponent(r.language)}-${color}?style=flat-square&logoColor=white)`
      : '—';
    const stars = `![Stars](https://img.shields.io/github/stars/${username}/${r.name}?style=flat-square&color=58A6FF&labelColor=0D1117)`;
    const forks = `![Forks](https://img.shields.io/github/forks/${username}/${r.name}?style=flat-square&color=58A6FF&labelColor=0D1117)`;
    return `| [**${r.name}**](${r.url}) | ${r.description} | ${langBadge} | ${stars} | ${forks} |`;
  });

  return [
    '| Repository | Description | Language | Stars | Forks |',
    '|:-----------|:------------|:--------:|:-----:|:-----:|',
    ...rows,
  ].join('\n');
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
