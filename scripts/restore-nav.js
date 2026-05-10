const fs = require('fs');
const path = require('path');

const htmlDir = path.join(__dirname, '../html');
const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

const links = [
    { name: 'Home', href: 'index.html' },
    { name: 'Explore', href: 'field.html' },
    { name: 'My Roadmaps', href: 'my-roadmaps.html' },
    { name: 'AI Generator', href: 'roadmap-generator.html' },
    { name: 'About Us', href: 'about-us.html' },
];

for (const file of files) {
  const filePath = path.join(htmlDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let navLinks = '';
  for (const link of links) {
      const isActive = link.href === file ? 'active' : '';
      navLinks += `\n                    <li><a href="${link.href}" class="nav-link ${isActive}">${link.name}</a></li>`;
  }
  
  const newNav = `<nav class="main-nav" aria-label="Main navigation">
                <ul>${navLinks}
                    <li><a href="contact-us.html" class="nav-link ${file === 'contact-us.html' ? 'active' : ''}">Contact</a></li>
                </ul>
            </nav>`;

  content = content.replace(/<nav class="main-nav" aria-label="Main navigation">[\s\S]*?<\/nav>/, newNav);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Restored nav and set active states in', file);
}
