// web-ext liest diese Datei automatisch (build / sign / run).
// Alles hier Gelistete landet NICHT im .xpi/.zip.
export default {
  ignoreFiles: [
    "README.md",
    "amo-metadata.json",
    "web-ext.config.mjs",
    ".web-ext-ignore",
    ".amo-upload-uuid",
    "JWTs",
    "*.txt",                    // faengt u.a. die Mozilla-Backup-Codes ab
    "*Backup authentication codes*",
    "web-ext-artifacts",
    "**/*.map"
  ]
};
