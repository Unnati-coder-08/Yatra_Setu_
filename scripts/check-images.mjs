import { DESTINATIONS, GUIDES, HOMESTAYS } from "../src/lib/seed-data.mjs";

const urls = new Set();
for (const d of DESTINATIONS) {
  d.images.forEach((u) => urls.add(u));
  d.experiences.forEach((e) => urls.add(e.img));
  GUIDES.filter((g) => g.dest === d.slug).forEach((g) => urls.add(g.img));
  HOMESTAYS.filter((h) => h.dest === d.slug).forEach((h) => urls.add(h.img));
}

const all = [...urls];
let fail = 0;
await Promise.all(
  all.map(async (u) => {
    try {
      const r = await fetch(u, { method: "GET", headers: { Range: "bytes=0-1" } });
      if (r.status !== 200 && r.status !== 206) {
        console.log(`FAIL ${r.status} ${u}`);
        fail++;
      }
    } catch (e) {
      console.log(`ERR  ${u} ${e.message}`);
      fail++;
    }
  })
);
console.log(`\n${all.length} URLs checked, ${fail} failed`);
