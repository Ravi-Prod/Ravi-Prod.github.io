# Product brochure source

`brochure.html` is the source for `/bgtech-brochure.pdf` (5 A4 pages).
This folder is not published by GitHub Pages because its name starts with `_`.

To rebuild the PDF after editing, from this folder:

```
chrome --headless=new --no-pdf-header-footer --virtual-time-budget=6000 --print-to-pdf=../bgtech-brochure.pdf brochure.html
```
