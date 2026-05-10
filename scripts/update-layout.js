const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, '../html');
const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

const newHeader = `<header class="site-header navbar-glass">
        <div class="header-inner">
            <a href="index.html" class="logo">
                <span class="logo-icon">&#9670;</span>
                <span class="logo-text">TechPath</span>
            </a>
            <nav class="main-nav" aria-label="Main navigation">
                <ul>
                    <li><a href="contact-us.html" class="btn-primary" style="padding: 0.5rem 1.2rem; color: white;">Contact</a></li>
                </ul>
            </nav>
            <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
                <span></span><span></span><span></span>
            </button>
        </div>
    </header>`;

const newFooter = `<footer class="site-footer">
        <div class="footer-inner" style="text-align: center; justify-content: center; padding-bottom: 2rem;">
            <p class="footer-copy" style="margin: 0; color: var(--text-muted);">&copy; 2026 TechPath &mdash; University of Jeddah, CCSW321</p>
        </div>
    </footer>`;

for (const file of files) {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace header
  content = content.replace(/<header class="site-header navbar-glass">[\s\S]*?<\/header>/, newHeader);
  
  // Replace footer
  content = content.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, newFooter);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', file);
}
