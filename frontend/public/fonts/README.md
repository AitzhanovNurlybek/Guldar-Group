# Self-hosted fonts

These unmodified WOFF2 assets were copied from this project's existing Next.js Google Fonts cache on 2026-10-22. They remove the build-time request to Google Fonts and are served from the site's own origin.

- **Manrope:** normal, variable weight 200-800.
- **Montserrat:** normal, weights 600, 700 and 800, using the exact existing CSS weight-to-file mappings.
- Retained subsets: Latin, Latin Extended, Cyrillic, Cyrillic Extended. Extended subsets include the tenge symbol and Kazakh Cyrillic characters. Unused Greek and Vietnamese subsets were omitted. Browsers request only the subsets needed by visible text.
- Both families use `font-display: swap`. The generated Arial fallback metrics were preserved to limit layout shift.
- Font data was not modified or converted; only filenames and CSS URLs were changed.

## Licenses

Both font families are distributed under the SIL Open Font License 1.1. The license and copyright notices are included in `manrope-OFL.txt` and `montserrat-OFL.txt`.

Official sources, verified on 2026-10-22:

- https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt
- https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt

## Cache provenance

The mappings, weight declarations, Unicode ranges and fallback metrics were read from:

- `.next/dev/static/chunks/[next]_internal_font_google_manrope_27cf40ec_module_css_1igg3k2._.single.css`
- `.next/dev/static/chunks/[next]_internal_font_google_montserrat_70629ab7_module_css_1igg3k2._.single.css`

Binary files were copied from `.next/static/media/`. Cache directories are not required after this copy. The bundled files and `src/app/fonts.css` are the permanent sources used by the site.

| Bundled file | Original cache filename | SHA-256 |
| --- | --- | --- |
| `manrope-cyrillic-ext.woff2` | `a342834df7752944-s.3hd2l7bm32o7k.woff2` | `e8c0b39992f06b3dc9a9834494088014859f363bf6ca8792b6bb07e17c7965f3` |
| `manrope-cyrillic.woff2` | `d3fe2f289711ac3f-s.p.1l2zhvq5eocqf.woff2` | `95a493061fe0a8d0d027c2892747134ba747141112d3be4d5022e70ab7d3a1a6` |
| `manrope-latin-ext.woff2` | `6ab0db14f70d8ed6-s.13hnt-xgp82zk.woff2` | `ce093b341d9c10658ee1eaa85c5f8042ff3307bc6ccfc5f405616eb437f0009e` |
| `manrope-latin.woff2` | `a343f882a40d2cc9-s.p.1sj6eobyi31rd.woff2` | `e310b55a7fd9677f5e3555e6c6c4d064fa1f1d24393f0ddbe217cea12a8c432f` |
| `montserrat-cyrillic-ext.woff2` | `8298327da6d5bcce-s.3q4n78m6muld7.woff2` | `744830a0e77dd14dd543a4230d6e3ce67ca961634074b5d536ebafc66c732301` |
| `montserrat-cyrillic.woff2` | `44fac91e6f2d2b1b-s.p.1d_6dtvtn9g3_.woff2` | `0b00fbd6edcc84cd5f77364bbeb06b75ed263c740061eba34511f1e2ac1a82d3` |
| `montserrat-latin-ext.woff2` | `a88409fdd7dc121c-s.1mvr14jy3vxq7.woff2` | `920711de9ae96c18970fa4faca73cd302b93ac5ed57ebeb6bfec2ddeff930082` |
| `montserrat-latin.woff2` | `e8f2fbee2754df70-s.p.1dqa_6e_ad4sj.woff2` | `6438d7b8ea9c7c3992d5e2fd2afdb1ff948570a3ef0bedae76247b51632960ba` |
