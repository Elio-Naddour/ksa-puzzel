const fs = require("fs");
const bounds = require("svg-path-bounds");

const svg = fs.readFileSync("./src/assets/sa.svg", "utf8");

// Matches both <path ... /> and <path ...></path>
const regex = /<path\b([^>]*?)\/?>/g;

const regions = [];

let match;

while ((match = regex.exec(svg)) !== null) {
  const attrs = match[1];

  const get = (name) => {
    const result = attrs.match(
      new RegExp(`${name}="([^"]+)"`)
    );

    return result ? result[1] : "";
  };

  const path = get("d");

  if (!path) continue;

  const [minX, minY, maxX, maxY] = bounds(path);

  const width = maxX - minX;
  const height = maxY - minY;

  regions.push({
    id: get("id"),
    name: get("name") || get("id"),

    path,

    fill: get("fill") || "#6EC1E4",

    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
    },

    center: {
      x: minX + width / 2,
      y: minY + height / 2,
    },

    target: {
      x: minX,
      y: minY,
    },
  });
}

fs.writeFileSync(
  "./src/data/regions.js",
  `export default ${JSON.stringify(regions, null, 4)};`
);

console.log("==================================");
console.log(`Parsed ${regions.length} regions`);
console.log("Saved to src/data/regions.js");
console.log("==================================");