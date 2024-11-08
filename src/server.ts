// src/server.ts
import fs from 'fs';
import path from 'path';
import express from 'express';
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';

const app = express();
const PORT = 8080;

// or UMD script
// <script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.umd.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/marked-highlight/lib/index.umd.js"></script>
// const { Marked } = globalThis.marked;
// const { markedHighlight } = globalThis.markedHighlight;
const marked = new Marked(
  markedHighlight({
	emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

// Function to inject content into the template
const renderTemplate = (content: string, title: string = "My Blog") => {
    const templatePath = path.join(__dirname, 'public', 'template.html');
    let template = fs.readFileSync(templatePath, 'utf-8');
    template = template.replace('${content}', `${content}`);
    template = template.replace('${title}', `${title}`);
    return template;
};

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'home.html');

    fs.readFile(indexPath, 'utf-8', (err, htmlContent) => {
        if(err) return res.status(500).send('Error loading home page.');

        const content = `<div>${htmlContent}</div>`;
        const homePage = renderTemplate(content, "mrv's blog");
        res.send(homePage);
    });
});

interface Posts {
    title: string;
    filename: string;
    url: string;
}

// Blog home route to list all posts
app.get('/blog', (req, res) => {
    const postsPath = path.join(__dirname, 'public', 'posts.json');

    fs.readFile(postsPath, 'utf-8', (err, data) => {
        if (err) return res.status(500).send('Error loading blog posts');

        const posts: Posts[] = JSON.parse(data);
        const postLinks = posts
        .map(post => `<li><a href="/blog/${post.url}">${post.title}</a></li>`)
        .join('');

        const content = `<h2>Posts</h2><ul>${postLinks}</ul>`;
        res.send(renderTemplate(content, "Blog"));
    });
});

// Route for individual blog posts
app.get('/blog/:postName', (req, res) => {
    const postName = req.params.postName;
    const postsPath = path.join(__dirname, 'public', 'posts.json');

    // Read posts.json to find the matching post file
    fs.readFile(postsPath, 'utf-8', (err, data) => {
        if (err) return res.status(500).send('Error loading blog posts');

        const posts: Posts[] = JSON.parse(data);
        const post = posts.find(p => p.url === postName);

        if (!post) return res.status(404).send(renderTemplate(`<p>Post not found</p>`, "Not Found"));

        // Read and convert the markdown file for the selected post
        const filePath = path.join(__dirname, 'public', 'posts', post.filename);
        fs.readFile(filePath, 'utf-8', (err, markdownData) => {
            if (err) return res.status(404).send(renderTemplate(`<p>Post not found</p>`, "Not Found"));

            const htmlContent = marked.parse(markdownData);
            const content = `<h2>${post.title}</h2>${htmlContent}`;
            res.send(renderTemplate(content, post.title));
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
