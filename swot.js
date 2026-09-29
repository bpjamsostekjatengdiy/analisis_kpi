const CONFIG = {
  regionCode: "905",
  defaultUnitCode: "KW:905",
  sourceUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSvtCO0B41vi76Vj0nHO3edY3Bqa39PG_5xRQJuvgxG6WeSC4JY62cAtG67HtyoTSyQ-W7CFDxWcrXq/pub?output=csv&gid=978418270",
};

const $ = (id) => document.getElementById(id);
let appState = null;

const KANWIL_NAMES = {
  "901": "KANWIL SUMBAGUT",
  "902": "KANWIL SUMBAGSEL",
  "903": "KANWIL DKI JAKARTA",
  "904": "KANWIL JAWA BARAT",
  "905": "KANWIL JATENG DAN DIY",
  "906": "KANWIL JATIM",
  "907": "KANWIL KALIMANTAN",
  "908": "KANWIL SULAWESI MALUKU",
  "909": "KANWIL SUMBARRIAU",
  "910": "KANWIL BANTEN",
  "911": "KANWIL BANUSPA",
};

const BRANCH_NAMES_905 = {
  L00: "SEMARANG PEMUDA",
  L01: "SURAKARTA",
  L02: "CILACAP",
  L03: "YOGYAKARTA",
  L04: "PEKALONGAN",
  L05: "KUDUS",
  L06: "MAGELANG",
  L07: "TEGAL",
  L08: "KLATEN",
  L09: "PURWOKERTO",
  L10: "UNGARAN",
  L11: "SEMARANG MAJAPAHIT",
  L12: "SUKOHARJO SLAMET RIYADI",
  L13: "SLEMAN GODEAN",
  L14: "BOYOLALI RANDUSARI",
  L15: "PURBALINGGA AHMAD YANI",
  L16: "BANTUL RINGIN HARJO",
  L17: "GUNUNG KIDUL WONOSARI",
  L18: "KULON PROGO WATES",
  L19: "JEPARA WAKHID HASYIM",
  L20: "PATI SUSANTO",
  L21: "GROBOGAN PURWODADI",
  L22: "KARANGANYAR TRIYAGAN",
  L23: "PEMALANG PERINTIS KEMERDEKAAN",
  L24: "SRAGEN SUKOWATI",
  L25: "KEBUMEN PEMUDA",
  L26: "BANJARNEGARA PEMUDA",
  L27: "BLORA AHMAD YANI",
  L28: "BATANG KAUMAN",
  L29: "TEMANGGUNG KERTOSARI",
  L30: "PURWOREJO TENTARA PELAJAR",
  L31: "WONOSOBO MUNTANG",
  L32: "REMBANG KARTINI",
  L33: "BREBES AHMAD YANI",
  L34: "KENDAL SOEKARNO HATTA",
};

function cleanText(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text && text !== "NULL" && text !== "undefined" ? text : fallback;
}

function unitLabel(unit) {
  if (!unit) return "-";
  const code = unit.type === "kanwil" ? unit.rawCode : unit.code;
  return `${code} - ${unit.name}`;
}

function shortUnitLabel(unit) {
  if (!unit) return "-";
  const code = unit.type === "kanwil" ? unit.rawCode : unit.code;
  return `${code} - ${unit.name}`;
}

function unitCode(unit) {
  return unit?.type === "kanwil" ? unit.rawCode : unit?.code;
}

function icon(name) {
  const paths = {
    outcome:
      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    driver:
      '<path d="M4 19 19 4"/><path d="M13 4h6v6"/><path d="M5 5h5"/><path d="M5 10h3"/>',
    resources:
      '<path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="10" width="3" height="6"/><rect x="12" y="7" width="3" height="9"/><rect x="17" y="4" width="3" height="12"/>',
    addmin:
      '<path d="M7 7h10"/><path d="M7 17h10"/><path d="M9 4 6 7l3 3"/><path d="m15 14 3 3-3 3"/>',
    strength:
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    weakness:
      '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 4.3 2.8 17.4A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.6L13.7 4.3a2 2 0 0 0-3.4 0Z"/>',
    opportunity:
      '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-7"/><path d="M14 7h5v5"/>',
    threat:
      '<path d="M7 7h10"/><path d="M7 17h10"/><path d="M9 4 6 7l3 3"/><path d="m15 14 3 3-3 3"/>',
    strategy:
      '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M5 6H3a3 3 0 0 0 3 3h1"/><path d="M19 6h2a3 3 0 0 1-3 3h-1"/>',
  };
  return `<span class="swot-js-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${paths[name] ?? paths.strategy}</svg></span>`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift().map((header, index) => {
    const cleanHeader = header.trim().replace(/^\uFEFF/, "");
    if (cleanHeader) return cleanHeader;
    return index === 0 ? "kode_detil" : `kolom_${index + 1}`;
  });
  return rows
    .filter((values) => values.some((value) => value.trim() !== ""))
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
    );
}

function toNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw || raw === "NULL" || raw === "#VALUE!" || raw === "#N/A") return null;
  const normalized = raw.includes(",") ? raw.replaceAll(".", "").replace(",", ".") : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatSigned(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}

function formatSignedMetric(indicatorName, value, unit = "") {
  const number = toNumber(value);
  if (number === null) return "-";
  const sign = number > 0 ? "+" : number < 0 ? "-" : "";
  const abs = Math.abs(number);
  const name = String(indicatorName || "").toLowerCase();

  if (unit === "rp" || name.includes("jumlah penerimaan iuran")) {
    return `${sign}Rp${formatCompactNumber(abs)}`;
  }

  if (unit === "tk") {
    return `${sign}${formatCompactNumber(abs)} TK`;
  }

  return `${sign}${formatMetricValue(indicatorName, abs)}`;
}

function formatCompactNumber(value, decimals = 1) {
  const number = toNumber(value);
  if (number === null) return cleanText(value);
  const abs = Math.abs(number);
  const units = [
    { value: 1_000_000_000_000, suffix: "T" },
    { value: 1_000_000_000, suffix: "M" },
    { value: 1_000_000, suffix: "jt" },
    { value: 1_000, suffix: "rb" },
  ];
  const unit = units.find((item) => abs >= item.value);
  if (!unit) return formatNumber(number, Number.isInteger(number) ? 0 : decimals);
  return `${formatNumber(number / unit.value, decimals)} ${unit.suffix}`;
}

function formatMetricValue(indicatorName, value) {
  const name = String(indicatorName || "").toLowerCase();
  const number = toNumber(value);
  if (number === null) return cleanText(value);

  if (name.includes("jumlah penerimaan iuran") || name.includes("nominal pembiayaan")) {
    return `Rp${formatCompactNumber(number)}`;
  }

  if (
    name.includes("tk aktif") ||
    name.includes("peserta pembiayaan") ||
    name.includes("jakon")
  ) {
    return formatCompactNumber(number);
  }

  if (
    name.includes("%") ||
    name.includes("rate") ||
    name.includes("length of stay") ||
    name.includes("ketertagihan") ||
    name.includes("migrasi") ||
    name.includes("governance") ||
    name.includes("indeks")
  ) {
    return `${formatNumber(number, 2)} poin`;
  }

  return formatNumber(number, Number.isInteger(number) ? 0 : 2);
}

function formatDateId(dateText) {
  const [year, month, day] = String(dateText || "").split("-");
  if (!year || !month || !day) return cleanText(dateText);
  return `${day}-${month}-${year}`;
}

function valueByLooseKey(row, includes) {
  const key = Object.keys(row || {}).find((item) => {
    const normalized = item.toLowerCase().replace(/[_-]+/g, " ");
    return includes.every((text) => normalized.includes(text));
  });
  return key ? row[key] : null;
}

function scoreGrowth(row) {
  const growth = row.score_growth2 ?? row.score_total_growth ?? valueByLooseKey(row, ["total", "growth"]);
  const growthNumber = toNumber(growth);
  if (growthNumber !== null) return growthNumber;
  const h1Score =
    toNumber(row["score_total_h-1"]) ??
    toNumber(valueByLooseKey(row, ["score total", "h 1"])) ??
    toNumber(valueByLooseKey(row, ["score total", "h-1"]));
  const currentScore = toNumber(row.score_total);
  return currentScore !== null && h1Score !== null ? currentScore - h1Score : null;
}

function detailCode(row) {
  return row.kode_detil ?? valueByLooseKey(row, ["kode", "detil"]);
}

function rowDailyGrowth(row) {
  const directGrowth = toNumber(row.realisasi_growth);
  if (directGrowth !== null) return directGrowth;
  const current = toNumber(row.realisasi);
  const previous = toNumber(row["realisasi_h-1"]);
  return current !== null && previous !== null ? current - previous : null;
}

function latestKey(rows) {
  return rows
    .filter(
      (row) =>
        /^\d{6}$/.test(String(row.periode || "").trim()) &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(row.tgl_proses || "").trim()),
    )
    .map((row) => `${row.periode}|${row.tgl_proses}`)
    .sort()
    .at(-1);
}

function uniqueUnits(rows) {
  const units = new Map();
  rows.forEach((row) => {
    const code = row.kode_kantor;
    if (!code || code === "NULL") return;
    const fallbackName =
      row.kode_wilayah === CONFIG.regionCode
        ? (BRANCH_NAMES_905[code] ?? `KANTOR CABANG ${code}`)
        : `KANTOR CABANG ${code}`;
    units.set(code, {
      code,
      name: cleanText(row.nama_kantor, fallbackName),
      className: cleanText(row.kelas, "KELAS"),
      score: toNumber(row.score_total),
      scoreGrowth: scoreGrowth(row),
      rank: toNumber(row.rank),
      regionCode: row.kode_wilayah,
    });
  });
  return [...units.values()].sort(
    (a, b) =>
      String(a.className).localeCompare(String(b.className), "id") ||
      a.rank - b.rank ||
      String(a.name).localeCompare(String(b.name), "id"),
  );
}

function uniqueKanwils(rows) {
  const units = new Map();
  rows.forEach((row) => {
    const code = row.kode_kantor;
    if (!code || code === "NULL") return;
    units.set(`KW:${code}`, {
      code: `KW:${code}`,
      rawCode: code,
      name: cleanText(row.nama_kantor, KANWIL_NAMES[code] ?? `KANWIL ${code}`),
      className: "KANWIL",
      score: toNumber(row.score_total),
      scoreGrowth: scoreGrowth(row),
      rank: toNumber(row.rank),
      regionCode: row.kode_wilayah,
      type: "kanwil",
    });
  });
  return [...units.values()].sort((a, b) => a.rank - b.rank || b.score - a.score);
}

function compareByIndicator(rows, selectedCode, otherCode) {
  const selectedRows = rows.filter((row) => row.kode_kantor === selectedCode);
  const lookup = new Map(rows.map((row) => [`${row.kode_kantor}|${detailCode(row)}`, row]));
  return selectedRows
    .map((selected) => {
      const other = lookup.get(`${otherCode}|${detailCode(selected)}`);
      if (!other) return null;
      const selectedScore = toNumber(selected.score) ?? 0;
      const otherScore = toNumber(other.score) ?? 0;
      return {
        indicatorCode: detailCode(selected),
        name: selected.nama,
        type: indicatorType(selected),
        direction: indicatorDirection(selected),
        weight: toNumber(selected.bobot),
        target: selected.target,
        realization: selected.realisasi,
        selectedScore,
        otherScore,
        gap: selectedScore - otherScore,
        selectedRank: toNumber(selected.rank_indikator),
      };
    })
    .filter(Boolean);
}

function indicatorDirection(row) {
  const minFlag = cleanText(row.MIN, "");
  if (minFlag !== "" && minFlag !== "0" && toNumber(minFlag) !== 0) return "min";
  return "add";
}

function indicatorType(row) {
  const flags = [
    { key: "OUT", label: "Outcome", order: 1, icon: "outcome" },
    { key: "DRV", label: "Driver", order: 2, icon: "driver" },
    { key: "RES", label: "Resources", order: 3, icon: "resources" },
    { key: "ADD", label: "Add/Min", order: 4, icon: "addmin" },
    { key: "MIN", label: "Add/Min", order: 4, icon: "addmin" },
  ];
  const match = flags.find((flag) => {
    const raw = cleanText(row[flag.key], "");
    const number = toNumber(raw);
    return raw !== "" && raw !== "0" && number !== 0;
  });
  if (match) return match;

  const category = cleanText(row.kategori, "Lainnya").toUpperCase();
  if (category.includes("OUT")) return { label: "Outcome", order: 1, icon: "outcome" };
  if (category.includes("DRV") || category.includes("DRIVER")) return { label: "Driver", order: 2, icon: "driver" };
  if (category.includes("RES")) return { label: "Resources", order: 3, icon: "resources" };
  if (category.includes("ADD") || category.includes("MIN")) return { label: "Add/Min", order: 4, icon: "addmin" };
  return { label: "Lainnya", order: 9, icon: "strategy" };
}

function branchOptions(branchUnits, kanwilUnits) {
  const kanwil = kanwilUnits.find((unit) => unit.rawCode === CONFIG.regionCode);
  const kanwilOption = kanwil
    ? `<option value="${kanwil.code}">${unitLabel(kanwil)} (Kanwil Nasional, Rank ${formatNumber(kanwil.rank, 0)}/${formatNumber(kanwilUnits.length, 0)})</option>`
    : "";
  const branchOptionsHtml = branchUnits
    .filter((unit) => unit.regionCode === CONFIG.regionCode)
    .sort((a, b) => String(a.code).localeCompare(String(b.code), "id"))
    .map(
      (unit) =>
        `<option value="${unit.code}">${unit.code} - ${unit.name} (${unit.className}, Rank ${formatNumber(unit.rank, 0)})</option>`,
    )
    .join("");
  return `${kanwilOption}${branchOptionsHtml}`;
}

function listItems(items, emptyText, mode = "neutral") {
  if (!items.length) return `<li>${emptyText}</li>`;
  const grouped = new Map();
  items.forEach((item) => {
    const label = item.type?.label ?? "Lainnya";
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label).push(item);
  });

  return [...grouped.entries()]
    .sort((a, b) => (a[1][0]?.type?.order ?? 9) - (b[1][0]?.type?.order ?? 9))
    .map(([label, groupItems]) => {
      const groupContent = groupItems
        .map(
          (item, index) => `
        <li>
          <strong><em>${formatNumber(index + 1, 0)}</em>${cleanText(item.name)}</strong>
          <span>Kode ${cleanText(item.indicatorCode)} | Rank parameter ${formatNumber(item.selectedRank, 0)} | Score ${formatNumber(item.selectedScore)} | Gap ${formatSigned(item.gap)}</span>
        </li>
      `,
        )
        .join("");
      const groupIcon = groupItems[0]?.type?.icon ?? "strategy";
      return `<li class="swot-group-title">${icon(groupIcon)}${label}</li>${groupContent}`;
    })
    .join("");
}

function parameterKey(item) {
  return String(item?.name || "")
    .trim()
    .toLowerCase();
}

function takeUnused(items, usedKeys) {
  return items.filter((item) => {
    const key = parameterKey(item);
    if (!key || usedKeys.has(key)) return false;
    usedKeys.add(key);
    return true;
  });
}

function shortItem(item, fallback) {
  if (!item) return fallback;
  return `${cleanText(item.name)} (${formatSigned(item.gap)})`;
}

function strategyMatrixHtml({ strengths, weaknesses, opportunities, threats }) {
  const mainStrength = strengths[0];
  const secondStrength = strengths[1] ?? mainStrength;
  const mainWeakness = weaknesses[0];
  const secondWeakness = weaknesses[1] ?? mainWeakness;
  const mainOpportunity = opportunities[0];
  const secondOpportunity = opportunities[1] ?? mainOpportunity;
  const mainThreat = threats[0];
  const secondThreat = threats[1] ?? mainThreat;

  const cards = [
    {
      code: "SO",
      icon: "opportunity",
      title: "Agresif",
      label: "Gunakan kekuatan untuk menangkap peluang",
      text:
        mainStrength && mainOpportunity
          ? `Manfaatkan bantalan ${shortItem(mainStrength)} untuk mempercepat penutupan peluang ${shortItem(mainOpportunity)}.`
          : "Belum ada kombinasi kekuatan dan peluang yang cukup jelas.",
    },
    {
      code: "WO",
      icon: "driver",
      title: "Perbaikan",
      label: "Tutup kelemahan melalui peluang terdekat",
      text:
        mainWeakness && secondOpportunity
          ? `Fokus perbaiki ${shortItem(mainWeakness)} dengan menjadikan ${shortItem(secondOpportunity)} sebagai quick win kenaikan score.`
          : "Belum ada peluang yang cukup dekat untuk menutup kelemahan utama.",
    },
    {
      code: "ST",
      icon: "strength",
      title: "Defensif Aktif",
      label: "Gunakan kekuatan untuk menahan ancaman",
      text:
        secondStrength && mainThreat
          ? `Jaga keunggulan ${shortItem(secondStrength)} untuk mengimbangi ancaman ${shortItem(mainThreat)} dari rank bawah.`
          : "Belum ada kombinasi kekuatan dan ancaman yang perlu diprioritaskan.",
    },
    {
      code: "WT",
      icon: "weakness",
      title: "Mitigasi",
      label: "Minimalkan kelemahan dan hindari ancaman",
      text:
        secondWeakness && secondThreat
          ? `Kunci risiko pada ${shortItem(secondWeakness)} dan ${shortItem(secondThreat)} agar kelemahan tidak berubah menjadi penyebab tersusul.`
          : "Risiko gabungan kelemahan dan ancaman belum dominan.",
    },
  ];

  return cards
    .map(
      (card) => `
        <article class="strategy-card strategy-${card.code.toLowerCase()}">
          <span class="strategy-code">${icon(card.icon)}${card.code}</span>
          <h3>${card.title}</h3>
          <small>${card.label}</small>
          <p>${card.text}</p>
        </article>
      `,
    )
    .join("");
}

function renderSwot(selectedCode) {
  const isKanwil = selectedCode.startsWith("KW:");
  const sourceRows = isKanwil ? appState.kanwilRows : appState.branchRows;
  const units = isKanwil ? appState.kanwilUnits : appState.branchUnits;
  const selected = units.find((unit) => unit.code === selectedCode);
  if (!selected) return;

  const selectedRawCode = isKanwil ? selected.rawCode : selected.code;
  const classUnits = units
    .filter((unit) => isKanwil || unit.className === selected.className)
    .sort((a, b) => a.rank - b.rank || b.score - a.score);
  const above = classUnits.find((unit) => unit.rank === selected.rank - 1);
  const below = classUnits.find((unit) => unit.rank === selected.rank + 1);
  const aboveComparison = above ? compareByIndicator(sourceRows, selectedRawCode, unitCode(above)) : [];
  const belowComparison = below ? compareByIndicator(sourceRows, selectedRawCode, unitCode(below)) : [];
  const lossesToAbove = aboveComparison.filter((item) => item.gap < 0).sort((a, b) => a.gap - b.gap);
  const buffersVsBelow = belowComparison.filter((item) => item.gap > 0).sort((a, b) => b.gap - a.gap);
  const risksFromBelow = belowComparison.filter((item) => item.gap < 0).sort((a, b) => a.gap - b.gap);
  const usedSwotKeys = new Set();
  const threats = takeUnused(risksFromBelow, usedSwotKeys);
  const remainingLosses = lossesToAbove.filter((item) => !usedSwotKeys.has(parameterKey(item)));
  const weaknessCount = Math.ceil(remainingLosses.length / 2);
  const weaknesses = takeUnused(remainingLosses.slice(0, weaknessCount), usedSwotKeys);
  const opportunities = takeUnused(
    remainingLosses.slice(weaknessCount).sort((a, b) => Math.abs(a.gap) - Math.abs(b.gap)),
    usedSwotKeys,
  );
  const strengths = takeUnused(buffersVsBelow, usedSwotKeys);
  const gapAbove = above ? selected.score - above.score : null;
  const gapBelow = below ? selected.score - below.score : null;
  const peerLabel = isKanwil ? "Kanwil nasional" : `cabang nasional ${selected.className}`;

  $("swotTitle").textContent = unitLabel(selected);
  $("rankTag").textContent = `Rank ${formatNumber(selected.rank, 0)} dari ${formatNumber(classUnits.length, 0)}`;
  $("classNote").textContent = `${unitLabel(selected)} dibandingkan dengan ${peerLabel}.`;
  $("swotSummary").innerHTML = `
    <div><span>Score</span><strong>${formatNumber(selected.score)}</strong></div>
    <div><span>Growth Harian</span><strong>${formatSigned(selected.scoreGrowth)}</strong></div>
    <div><span>Gap Rank Atas</span><small>${shortUnitLabel(above)}</small><strong>${formatSigned(gapAbove)}</strong></div>
    <div><span>Jarak Rank Bawah</span><small>${shortUnitLabel(below)}</small><strong>${formatSigned(gapBelow)}</strong></div>
  `;
  $("strengthList").innerHTML = listItems(strengths, "Belum ada bantalan dominan terhadap rank bawah.", "strength");
  $("weaknessList").innerHTML = listItems(weaknesses, "Tidak ada kelemahan dominan terhadap rank atas.", "weakness");
  $("opportunityList").innerHTML = listItems(opportunities, "Peluang kenaikan belum terbaca dari gap rank atas.", "opportunity");
  $("threatList").innerHTML = listItems(threats, "Ancaman tersusul belum dominan dari rank bawah.", "threat");
  $("strategyMatrix").innerHTML = strategyMatrixHtml({ strengths, weaknesses, opportunities, threats });

  const topWeakness = weaknesses[0];
  const topThreat = threats[0];
  const topStrength = strengths[0];
  const topOpportunity = opportunities[0];
  $("swotVerdict").textContent = `Kesimpulan SWOT: ${unitLabel(selected)} berada di rank ${formatNumber(selected.rank, 0)} dari ${formatNumber(classUnits.length, 0)} ${peerLabel}. ${topWeakness ? `Prioritas mengejar rank atas adalah ${topWeakness.name} dengan gap ${formatSigned(topWeakness.gap)} score.` : "Posisi terhadap rank atas relatif aman."} ${topOpportunity ? `Quick win peluang ada pada ${topOpportunity.name}.` : "Peluang cepat belum dominan."} ${topThreat ? `Risiko tersusul paling nyata berasal dari ${topThreat.name} dengan gap ${formatSigned(topThreat.gap)} score terhadap ${unitLabel(below)}.` : "Risiko tersusul langsung belum kuat."} ${topStrength ? `Bantalan terbaik saat ini adalah ${topStrength.name} dengan keunggulan ${formatSigned(topStrength.gap)} score.` : "Bantalan posisi perlu diperkuat."}`;
}

async function loadSwot() {
  try {
    const response = await fetch(`${CONFIG.sourceUrl}&cacheBust=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const allRows = parseCsv(await response.text());
    const key = latestKey(allRows);
    if (!key) throw new Error("Periode terbaru tidak ditemukan.");
    const [period, processDate] = key.split("|");
    const branchRows = allRows.filter(
      (row) =>
        row.periode === period &&
        row.tgl_proses === processDate &&
        row.tipe_kantor === "Kantor Cabang" &&
        row.kode_kantor !== "NULL",
    );
    const kanwilRows = allRows.filter(
      (row) =>
        row.periode === period &&
        row.tgl_proses === processDate &&
        row.tipe_kantor === "Kantor Wilayah" &&
        row.kode_kantor !== "NULL",
    );
    const branchUnits = uniqueUnits(branchRows);
    const kanwilUnits = uniqueKanwils(kanwilRows);
    appState = { branchRows, kanwilRows, branchUnits, kanwilUnits };
    $("unitSelect").innerHTML = branchOptions(branchUnits, kanwilUnits);
    $("unitSelect").value = CONFIG.defaultUnitCode;
    $("unitSelect").addEventListener("change", (event) => renderSwot(event.target.value));
    $("dataStamp").textContent = `Periode ${formatDateId(processDate)} - pembanding nasional sesuai kelas`;
    $("refreshStatus").textContent = `Terakhir dimuat ${new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    renderSwot(CONFIG.defaultUnitCode);
    $("loadingState").classList.add("hidden");
    $("swotContent").classList.remove("hidden");
  } catch (error) {
    $("loadingState").classList.add("hidden");
    $("errorState").classList.remove("hidden");
    $("errorMessage").textContent = error.message;
  }
}

loadSwot();

$("printSwotBtn")?.addEventListener("click", () => {
  window.print();
});

$("exportSwotJpgBtn")?.addEventListener("click", async () => {
  const button = $("exportSwotJpgBtn");
  const dashboard = document.querySelector(".dashboard");
  if (!window.html2canvas || !dashboard || !button) return;

  const originalText = button.textContent;
  button.textContent = "Exporting...";
  button.disabled = true;
  document.body.classList.add("is-exporting");

  try {
    const scale = Math.min(4, Math.max(3, window.devicePixelRatio || 1.5));
    const canvas = await window.html2canvas(dashboard, {
      backgroundColor: "#eef6f4",
      scale,
      useCORS: true,
      logging: false,
    });
    const marginPx = Math.round((96 / 2.54) * scale);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width + marginPx * 2;
    exportCanvas.height = canvas.height + marginPx * 2;
    const context = exportCanvas.getContext("2d");
    context.fillStyle = "#eef6f4";
    context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    context.drawImage(canvas, marginPx, marginPx);

    const selectedUnit = $("unitSelect")?.value?.replace("KW:", "KANWIL-") || "SWOT";
    const date = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");
    link.download = `swot-kpi-HD-${selectedUnit}-${date}.jpg`;
    link.href = exportCanvas.toDataURL("image/jpeg", 0.98);
    link.click();
  } finally {
    document.body.classList.remove("is-exporting");
    button.disabled = false;
    button.textContent = originalText;
  }
});
