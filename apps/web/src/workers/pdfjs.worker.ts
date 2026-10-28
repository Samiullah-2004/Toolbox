// pdf.js does its parsing in a Web Worker. Importing its worker code from this file lets the
// bundler package it like the rest of the site, so nothing has to be copied into public/.
import "pdfjs-dist/build/pdf.worker.min.mjs"
