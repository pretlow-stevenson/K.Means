import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const issues = [];
const redirectPages = new Set(['contact.html', 'symphony/maestro/docs/index.html']);
const primaryPages = new Set([
  'index.html',
  'about.html',
  'approach.html',
  'linguistic-bridge.html',
  'maestro.html',
  'parallax.html',
  'research.html'
]);

const walk = (directory) => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);

    if (entry.name === '.git') {
      return [];
    }

    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
};

const relative = (absolutePath) => path.relative(root, absolutePath).split(path.sep).join('/');
const htmlFiles = walk(root).filter((file) => file.endsWith('.html'));

const addIssue = (file, message) => {
  issues.push(`${relative(file)}: ${message}`);
};

const getAttribute = (attributes, name) => {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return match ? match[1] : null;
};

const stripUrl = (value) => value.split(/[?#]/, 1)[0];

const resolveLocalPath = (sourceFile, value) => {
  const cleanValue = decodeURIComponent(stripUrl(value));

  if (cleanValue.startsWith('/')) {
    return path.join(root, cleanValue.slice(1));
  }

  return path.resolve(path.dirname(sourceFile), cleanValue);
};

const isExternal = (value) => /^(?:[a-z]+:|\/\/)/i.test(value);

const readPngDimensions = (file) => {
  const buffer = fs.readFileSync(file);
  const pngSignature = '89504e470d0a1a0a';

  if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
};

for (const file of htmlFiles) {
  const fileName = relative(file);
  const html = fs.readFileSync(file, 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);

  if (!/^<!DOCTYPE html>/i.test(html)) {
    addIssue(file, 'missing HTML5 doctype');
  }

  if (!/<html\b[^>]*\blang="[^"]+"/i.test(html)) {
    addIssue(file, 'missing document language');
  }

  if (!/<meta\b[^>]*name="viewport"/i.test(html)) {
    addIssue(file, 'missing viewport metadata');
  }

  if (!/<title>[^<]+<\/title>/i.test(html)) {
    addIssue(file, 'missing page title');
  }

  if (primaryPages.has(fileName)) {
    if (!/<meta\b[^>]*name="description"/i.test(html)) {
      addIssue(file, 'missing meta description');
    }

    if (!/<link\b[^>]*rel="canonical"/i.test(html)) {
      addIssue(file, 'missing canonical URL');
    }

    if (!/<meta\b[^>]*property="og:title"/i.test(html) || !/<meta\b[^>]*property="og:url"/i.test(html)) {
      addIssue(file, 'missing Open Graph metadata');
    }
  }

  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  for (const id of new Set(duplicateIds)) {
    addIssue(file, `duplicate id "${id}"`);
  }

  for (const match of html.matchAll(/\baria-labelledby="([^"]+)"/g)) {
    for (const id of match[1].split(/\s+/)) {
      if (!ids.includes(id)) {
        addIssue(file, `aria-labelledby references missing id "${id}"`);
      }
    }
  }

  if (/\brole="menu(?:item)?"/i.test(html)) {
    addIssue(file, 'navigation uses application-menu roles without an application-menu interaction model');
  }

  if (!redirectPages.has(fileName)) {
    const h1Count = (html.match(/<h1\b/gi) || []).length;
    const mainCount = (html.match(/<main\b/gi) || []).length;

    if (h1Count !== 1) {
      addIssue(file, `expected one h1, found ${h1Count}`);
    }

    if (mainCount !== 1) {
      addIssue(file, `expected one main landmark, found ${mainCount}`);
    }
  }

  const headingLevels = [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
  for (let index = 1; index < headingLevels.length; index += 1) {
    if (headingLevels[index] > headingLevels[index - 1] + 1) {
      addIssue(file, `heading level jumps from h${headingLevels[index - 1]} to h${headingLevels[index]}`);
    }
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = match[1];
    const source = getAttribute(attributes, 'src');
    const width = getAttribute(attributes, 'width');
    const height = getAttribute(attributes, 'height');

    if (getAttribute(attributes, 'alt') === null) {
      addIssue(file, `image is missing alt text${source ? `: ${source}` : ''}`);
    }

    if (!/^\d+$/.test(width || '') || !/^\d+$/.test(height || '')) {
      addIssue(file, `image is missing intrinsic dimensions${source ? `: ${source}` : ''}`);
    }

    if (source && !isExternal(source)) {
      const imagePath = resolveLocalPath(file, source);

      if (!fs.existsSync(imagePath)) {
        addIssue(file, `missing image: ${source}`);
        continue;
      }

      const dimensions = readPngDimensions(imagePath);
      if (dimensions && (dimensions.width !== Number(width) || dimensions.height !== Number(height))) {
        addIssue(file, `declared dimensions do not match ${dimensions.width}x${dimensions.height} image: ${source}`);
      }
    }
  }

  for (const match of html.matchAll(/<(?:a|link|script)\b([^>]*)>/gi)) {
    const attributes = match[1];
    const value = getAttribute(attributes, 'href') || getAttribute(attributes, 'src');

    if (!value) {
      continue;
    }

    if (/\btarget="_blank"/i.test(attributes) && !/\brel="[^"]*\bnoopener\b[^"]*"/i.test(attributes)) {
      addIssue(file, `target="_blank" is missing rel="noopener": ${value}`);
    }

    if (isExternal(value) || value.startsWith('#')) {
      continue;
    }

    let target = resolveLocalPath(file, value);
    if (!fs.existsSync(target)) {
      addIssue(file, `missing local resource: ${value}`);
      continue;
    }

    if (fs.statSync(target).isDirectory()) {
      target = path.join(target, 'index.html');
    }

    const fragment = value.includes('#') ? value.slice(value.indexOf('#') + 1) : '';
    if (fragment && target.endsWith('.html')) {
      const targetHtml = fs.readFileSync(target, 'utf8');
      const escapedFragment = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (!new RegExp(`\\bid="${escapedFragment}"`).test(targetHtml)) {
        addIssue(file, `missing fragment target: ${value}`);
      }
    }
  }
}

const sitemapPath = path.join(root, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
for (const match of sitemap.matchAll(/<loc>https:\/\/kmeans\.ai\/([^<]*)<\/loc>/g)) {
  const route = match[1];
  const target = route === '' ? path.join(root, 'index.html') : path.join(root, route);

  if (!fs.existsSync(target)) {
    issues.push(`sitemap.xml: missing route target for https://kmeans.ai/${route}`);
  }
}

const imageSignatures = {
  '.png': '89504e470d0a1a0a',
  '.jpg': 'ffd8ff',
  '.jpeg': 'ffd8ff'
};

for (const file of walk(path.join(root, 'assets', 'images'))) {
  const extension = path.extname(file).toLowerCase();
  const expectedSignature = imageSignatures[extension];

  if (!expectedSignature) {
    continue;
  }

  const signature = fs.readFileSync(file).subarray(0, 8).toString('hex');
  if (!signature.startsWith(expectedSignature)) {
    addIssue(file, `file signature does not match ${extension} extension`);
  }
}

if (issues.length > 0) {
  console.error(issues.map((issue) => `- ${issue}`).join('\n'));
  console.error(`\nSite audit failed with ${issues.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log(`Site audit passed across ${htmlFiles.length} HTML files.`);
}
