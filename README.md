# K MEANS AI Website

The public K MEANS AI site is a dependency-free static website published through GitHub Pages.

## Structure

- `index.html` is the home page.
- The remaining top-level HTML files are product, research, approach, and company pages.
- `assets/css/site.css` contains shared interaction, navigation, accessibility, and motion foundations.
- `assets/css/home.css` contains home-page layout and the soccer easter egg presentation.
- `assets/css/pages.css` contains the shared layout system for interior pages.
- `assets/js/site-motion.js` contains shared navigation and progressive, reduced-motion-aware page animation behavior.
- `assets/js/home-soccer.js` conditionally loads the one-time home-page soccer flourish when the visitor is eligible to see it.
- `assets/js/vendor/` contains the pinned Matter.js runtime and its license; it is loaded only for that optional flourish.

## Local Preview

From the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Validation

Run the dependency-free structural audit before publishing:

```sh
node scripts/audit-site.mjs
```

The audit verifies local links and fragments, responsive image references and intrinsic dimensions, heading and ARIA targets, canonical and social metadata, structured data, external-link safety, sitemap routes, and image file signatures.

## Asset Guidelines

- Keep public assets close to their maximum rendered size while allowing for high-density screens.
- Use an extension that matches the asset's real file format.
- Add intrinsic `width` and `height` to every rendered image.
- Use responsive WebP sources in a `picture` element for large production images while retaining the original PNG fallback.
- Lazy-load images that are below the first viewport.
- Keep exploratory or source artwork out of production unless it is referenced by the site.
