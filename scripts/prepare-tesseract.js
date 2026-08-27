const fs = require("fs");
const path = require("path");
const https = require("https");

const destDir = path.join(__dirname, "../public/tesseract");
const langDir = path.join(destDir, "lang-data");

// 1. Create directories
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });

// 2. Copy worker from node_modules/tesseract.js/dist
const workerSrcDir = path.join(__dirname, "../node_modules/tesseract.js/dist");
const workerFiles = ["worker.min.js", "worker.min.js.map"];
workerFiles.forEach((file) => {
  const src = path.join(workerSrcDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied worker: ${file}`);
  } else {
    console.warn(`Worker source not found: ${src}`);
  }
});

// 3. Copy core from node_modules/tesseract.js-core
const coreSrcDir = path.join(__dirname, "../node_modules/tesseract.js-core");
if (fs.existsSync(coreSrcDir)) {
  const files = fs.readdirSync(coreSrcDir);
  files.forEach((file) => {
    if (file.startsWith("tesseract-core") && (file.endsWith(".js") || file.endsWith(".wasm"))) {
      const src = path.join(coreSrcDir, file);
      const dest = path.join(destDir, file);
      fs.copyFileSync(src, dest);
      console.log(`Copied core file: ${file}`);
    }
  });
} else {
  console.warn(`Core source dir not found: ${coreSrcDir}`);
}

// 4. Download language packs (eng, hin, ori) from fast tessdata repo
const langFiles = [
  {
    name: "eng.traineddata.gz",
    url: "https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_fast/eng.traineddata.gz",
  },
  {
    name: "hin.traineddata.gz",
    url: "https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_fast/hin.traineddata.gz",
  },
  {
    name: "ori.traineddata.gz",
    url: "https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_fast/ori.traineddata.gz",
  },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Status Code: ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function fetchLangs() {
  console.log("Downloading offline language packs...");
  for (const lang of langFiles) {
    const dest = path.join(langDir, lang.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
      console.log(`Language pack ${lang.name} already exists. Skipping.`);
      continue;
    }
    try {
      await downloadFile(lang.url, dest);
      console.log(`Downloaded language pack: ${lang.name}`);
    } catch (err) {
      console.warn(`Could not download ${lang.name} (system might be offline). Tesseract will fall back to cache/CDN if loaded online:`, err.message);
    }
  }
}

fetchLangs().then(() => console.log("Tesseract offline assets setup complete!"));
