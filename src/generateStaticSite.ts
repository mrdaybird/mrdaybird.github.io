// src/generateStaticSite.ts
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

const OUTPUT_DIR = path.join(__dirname, '../docs');

// Configure marked with marked-highlight for syntax highlighting
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-', // Add language class prefix for highlight.js
    highlight(code, lang) {
      return lang ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value;
    },
  })
);

// Helper to write a file to `docs` folder
const writeFileToDocs = (filename: string, content: string) => {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};


interface Posts {
    title: string;
    filename: string;
    url: string;
}

// Generate index.html for the blog list
const generateBlogListPage = () => {
  const postsPath = path.join(__dirname, 'public', 'posts.json');
  const posts: Posts[] = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));

  const postLinks = posts
    .map((post) => `<li><a href="/blog/${post.url}">${post.title}</a></li>`)
    .join('');
  const content = `<h2>Posts</h2><ul>${postLinks}</ul>`;
  const templatePath = path.join(__dirname, 'public', 'template.html');
  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template.replace('${title}', 'Eridanus')
  template = template.replace('${content}', `${content}`);
  writeFileToDocs('blog/index.html', template);
};


// Generate index.html for the blog list
const generateIndexPage = () => {
  const content = fs.readFileSync(path.join(__dirname, 'public', 'home.html'))
  const templatePath = path.join(__dirname, 'public', 'template.html');
  let template = fs.readFileSync(templatePath, 'utf-8');
  template = template.replace('${title}', 'Eridanus')
  template = template.replace('${content}', `${content}`);
  writeFileToDocs('index.html', template);
};



// Generate HTML files for each post
const generatePostPages = () => {
  const postsPath = path.join(__dirname, 'public', 'posts.json');
  const posts: Posts[] = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));

  posts.forEach((post) => {
    const filePath = path.join(__dirname, 'public', 'posts', post.filename);
    const markdownData = fs.readFileSync(filePath, 'utf-8');
    const htmlContent = marked(markdownData);
    const content = `<h2>${post.title}</h2>${htmlContent}`;

    const templatePath = path.join(__dirname, 'public', 'template.html');
    let template = fs.readFileSync(templatePath, 'utf-8');
    template = template.replace('${title}', post.title)
    template = template.replace('${content}', `${content}`);
    writeFileToDocs(`blog/${post.url}/index.html`, template);
  });
};

// Generate the static site files
const generateStaticSite = () => {
  // Copy CSS and JSON files
  fs.copyFileSync(path.join(__dirname, 'public', 'styles.css'), path.join(OUTPUT_DIR, 'styles.css'));
  fs.copyFileSync(path.join(__dirname, 'public', 'posts.json'), path.join(OUTPUT_DIR, 'posts.json'));
  fs.cpSync(path.join(__dirname, 'public', 'assets'), path.join(OUTPUT_DIR, 'assets'), {recursive: true});

  // Generate index and post pages
  generateIndexPage();
  generateBlogListPage();
  generatePostPages();
  console.log('Static site generated successfully in /docs');
};

// Run the static site generation
generateStaticSite();
