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

const MAIN_PARAMETER_DEFINITIONS = [
  {
    label: "Iuran",
    title: "Jumlah Penerimaan Iuran",
    unit: "rp",
    matcher: (name) => name.includes("jumlah penerimaan iuran"),
  },
  {
    label: "TK Aktif PU - PMI",
    title: "TK Aktif PU - PMI",
    unit: "tk",
    matcher: (name) => name.includes("tk aktif pu") && name.includes("pmi") && !name.includes("%"),
  },
  {
    label: "TK Aktif BPU",
    title: "TK Aktif BPU",
    unit: "tk",
    matcher: (name) => name === "tk aktif bpu",
  },
  {
    label: "TK Aktif Jakon",
    title: "TK Aktif Jakon",
    unit: "tk",
    matcher: (name) => name.includes("tk aktif jakon"),
  },
];

function cleanText(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text && text !== "NULL" && text !== "undefined" ? text : fallback;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function unitLabel(unit) {
  if (!unit) return "-";
  const code = unit.type === "kanwil" ? unit.rawCode : unit.code;
  return `${code} - ${unit.name}`;
}

function unitCode(unit) {
  if (!unit) return "-";
  return unit.type === "kanwil" ? unit.rawCode : unit.code;
}

function icon(name) {
  const paths = {
    trophy:
      '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M5 6H3a3 3 0 0 0 3 3h1"/><path d="M19 6h2a3 3 0 0 1-3 3h-1"/>',
    score:
      '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-7"/><path d="M14 7h5v5"/>',
    gap:
      '<path d="M7 7h10"/><path d="M7 17h10"/><path d="M9 4 6 7l3 3"/><path d="m15 14 3 3-3 3"/>',
    target:
      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    realization:
      '<path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="10" width="3" height="6"/><rect x="12" y="7" width="3" height="9"/><rect x="17" y="4" width="3" height="12"/>',
    percent:
      '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/>',
    alert:
      '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 4.3 2.8 17.4A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.6L13.7 4.3a2 2 0 0 0-3.4 0Z"/>',
    shield:
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    attack:
      '<path d="M4 19 19 4"/><path d="M13 4h6v6"/><path d="M5 5h5"/><path d="M5 10h3"/>',
    growth:
      '<path d="M3 17h18"/><path d="m18 8 3 3-3 3"/><path d="M3 12h6l3-5 4 10 3-5"/>',
  };
  return `<span class="ui-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${paths[name] ?? paths.score}</svg></span>`;
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
  const normalized = raw.includes(",")
    ? raw.replaceAll(".", "").replace(",", ".")
    : raw;
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
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}`;
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

function formatFullMetric(value, unit = "") {
  const number = toNumber(value);
  if (number === null) return "-";
  const sign = number > 0 ? "+" : number < 0 ? "-" : "";
  const abs = Math.abs(number);
  const formatted = formatNumber(abs, Number.isInteger(abs) ? 0 : 2);

  if (unit === "rp") return `${sign}Rp${formatted}`;
  if (unit === "tk") return `${sign}${formatted} TK`;
  if (unit === "percent") return `${sign}${formatted}%`;
  return `${sign}${formatted}`;
}

function metricUnitForRow(row) {
  const name = String(row?.nama || "").toLowerCase();
  if (name.includes("jumlah penerimaan iuran") || name.includes("nominal pembiayaan")) {
    return "rp";
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
    return "percent";
  }
  if (
    name.includes("tk aktif") ||
    name.includes("peserta pembiayaan") ||
    name.includes("jakon")
  ) {
    return "tk";
  }
  return "";
}

function formatDateId(dateText) {
  const [year, month, day] = String(dateText || "").split("-");
  if (!year || !month || !day) return cleanText(dateText);
  return `${day}-${month}-${year}`;
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

function formatMetricValue(indicatorName, value, kind = "value") {
  const name = String(indicatorName || "").toLowerCase();
  const number = toNumber(value);
  if (number === null) return cleanText(value);

  if (kind === "achievement") return `${formatNumber(number, 2)}%`;

  const isMoney =
    name.includes("jumlah penerimaan iuran") ||
    name.includes("nominal pembiayaan");
  if (isMoney) return `Rp${formatCompactNumber(value)}`;

  const isHeadcount =
    name.includes("tk aktif") ||
    name.includes("peserta pembiayaan") ||
    name.includes("jakon");
  if (isHeadcount) return formatCompactNumber(value);

  const isPercent =
    name.includes("%") ||
    name.includes("rate") ||
    name.includes("length of stay") ||
    name.includes("ketertagihan") ||
    name.includes("migrasi") ||
    name.includes("governance") ||
    name.includes("indeks");
  if (isPercent) return `${formatNumber(number, 2)}%`;

  return formatNumber(number, Number.isInteger(number) ? 0 : 2);
}

function gapLabel(value, emptyLabel = "-") {
  if (value === null || value === undefined || Number.isNaN(value)) return emptyLabel;
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

function assignGrowthRanks(units) {
  const ranked = [...units].sort((a, b) => {
    const aGrowth = a.scoreGrowth;
    const bGrowth = b.scoreGrowth;
    if (aGrowth === null || aGrowth === undefined) return 1;
    if (bGrowth === null || bGrowth === undefined) return -1;
    return bGrowth - aGrowth || a.rank - b.rank;
  });

  ranked.forEach((unit, index) => {
    unit.growthRank = index + 1;
  });
}

function valueByLooseKey(row, includes) {
  const keys = Object.keys(row || {});
  const key = keys.find((item) => {
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
    toNumber(valueByLooseKey(row, ["score total", "h-1"])) ??
    toNumber(valueByLooseKey(row, ["score", "kemarin"]));
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

function isLowerBetterIndicator(row) {
  const name = String(row?.nama || "").toLowerCase();
  return (
    toNumber(row?.MIN) === 1 ||
    name.includes("tidak valid") ||
    name.includes("over sla") ||
    name.includes("fraud")
  );
}

function directionalGrowth(row, growth) {
  if (growth === null || growth === undefined) return null;
  return isLowerBetterIndicator(row) ? -growth : growth;
}

function hasMetricValue(row) {
  const realization = toNumber(row.realisasi);
  return realization !== null && realization !== 0;
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
      rankScoreGrowth: toNumber(row.rank_score_growth),
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
      rankScoreGrowth: toNumber(row.rank_score_growth),
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
        name: selected.nama,
        category: selected.kategori,
        selectedScore,
        otherScore,
        gap: selectedScore - otherScore,
        selectedRank: toNumber(selected.rank_indikator),
        otherRank: toNumber(other.rank_indikator),
        target: selected.target,
        realization: selected.realisasi,
        achievement: selected.pencapaian,
      };
    })
    .filter(Boolean);
}

function tableRows(items, limit = 6) {
  if (!items.length) {
    return `<tr><td colspan="5">Tidak ada gap yang perlu ditampilkan.</td></tr>`;
  }

  return items
    .slice(0, limit)
    .map((item) => {
      const className = item.gap < 0 ? "minus" : "plus";
      return `
        <tr>
          <td>${formatNumber(item.selectedRank, 0)}</td>
          <td>${item.name}</td>
          <td>${formatNumber(item.selectedScore)}</td>
          <td>${formatNumber(item.otherScore)}</td>
          <td class="${className}">${formatSigned(item.gap)}</td>
        </tr>
      `;
    })
    .join("");
}

function rankCard(unit, options = {}) {
  const {
    modifier = "",
    referenceScore = null,
    totalPeers = null,
    gap = null,
    note = "",
    role = "neutral",
    showGrowth = false,
  } = options;

  if (!unit) {
    return `
      <div class="rank-top"><span class="rank-label">Tidak tersedia</span></div>
      <div class="rank-name">Belum ada pembanding</div>
      <div class="rank-score">-</div>
    `;
  }

  const percent = referenceScore
    ? Math.max(0, Math.min(100, (unit.score / referenceScore) * 100))
    : 0;
  const gapClass = gap < 0 ? "minus" : gap > 0 ? "plus" : "";
  const gapTitle = role === "above" ? "Gap ke unit ini" : role === "below" ? "Jarak dari unit ini" : "Gap";
  const growthClass = unit.scoreGrowth < 0 ? "minus" : unit.scoreGrowth > 0 ? "plus" : "";
  const growthPeerLabel = unit.type === "kanwil" ? "wilayah" : "cabang";
  const rankGrowthLabel =
    unit.growthRank !== null && unit.growthRank !== undefined
      ? `Rank Growth ${formatNumber(unit.growthRank, 0)}${totalPeers ? ` dari ${formatNumber(totalPeers, 0)} ${growthPeerLabel}` : ""}`
      : "Rank Growth -";
  const growthHtml = showGrowth
    ? `<div class="growth-pill ${growthClass}">
        ${icon("growth")}
        <span>Growth Harian Score</span>
        <strong>${gapLabel(unit.scoreGrowth)}</strong>
        <em>${rankGrowthLabel}</em>
      </div>`
    : "";
  return `
    <div class="rank-top">
      <span class="rank-label">${icon("trophy")}Rank ${formatNumber(unit.rank, 0)}${totalPeers ? ` dari ${formatNumber(totalPeers, 0)}` : ""}</span>
      <span class="rank-gap">${modifier}</span>
    </div>
    <div class="rank-name">${unitLabel(unit)}</div>
    <div class="rank-gap">${unit.className}</div>
    <div class="rank-metrics">
      <div>
        <span class="metric-label">${icon("score")}Score</span>
        <strong class="rank-score">${formatNumber(unit.score)}</strong>
      </div>
      <div>
        <span class="metric-label">${icon("gap")}${gapTitle}</span>
        <strong class="rank-delta ${gapClass}">${gapLabel(gap)}</strong>
      </div>
    </div>
    <div class="bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
    ${growthHtml}
    ${note ? `<p class="rank-note">${note}</p>` : ""}
  `;
}

function strongestCritical(losses) {
  return losses.find((item) => item.name.toLowerCase().includes("mlt")) ?? losses[0];
}

function topPainPoints(items, limit = 3) {
  const seen = new Set();
  return items
    .filter((item) => item && item.gap < 0)
    .sort((a, b) => a.gap - b.gap)
    .filter((item) => {
      const key = item.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function painPointRows(items) {
  if (!items.length) {
    return `<tr><td colspan="5">Tidak ada pain point yang perlu ditampilkan.</td></tr>`;
  }

  return items
    .map(
      (item) => `
        <tr>
          <td>${formatNumber(item.selectedRank, 0)}</td>
          <td>${item.name}</td>
          <td>${formatMetricValue(item.name, item.target)}</td>
          <td>${formatMetricValue(item.name, item.realization)}</td>
          <td>${formatMetricValue(item.name, item.achievement, "achievement")}</td>
        </tr>
      `,
    )
    .join("");
}

function mainParameterMatch(row) {
  const name = String(row.nama || "").toLowerCase();
  return MAIN_PARAMETER_DEFINITIONS.find((definition) => definition.matcher(name));
}

function movementItems(rows, direction) {
  const sign = direction === "down" ? -1 : 1;
  return rows
    .map((row) => ({
      row,
      growth: rowDailyGrowth(row),
      mainParameter: mainParameterMatch(row),
    }))
    .map((item) => ({
      ...item,
      directionalGrowth: directionalGrowth(item.row, item.growth),
    }))
    .filter((item) => {
      if (!hasMetricValue(item.row) || item.directionalGrowth === null) return false;
      return direction === "down" ? item.directionalGrowth < 0 : item.directionalGrowth >= 0;
    })
    .sort((a, b) => {
      const aMainIndex = a.mainParameter
        ? MAIN_PARAMETER_DEFINITIONS.indexOf(a.mainParameter)
        : Number.MAX_SAFE_INTEGER;
      const bMainIndex = b.mainParameter
        ? MAIN_PARAMETER_DEFINITIONS.indexOf(b.mainParameter)
        : Number.MAX_SAFE_INTEGER;
      if (aMainIndex !== bMainIndex) return aMainIndex - bMainIndex;
      if (a.mainParameter && b.mainParameter) return sign * (b.directionalGrowth - a.directionalGrowth);
      return direction === "down"
        ? a.directionalGrowth - b.directionalGrowth
        : b.directionalGrowth - a.directionalGrowth;
    });
}

function movementTableRows(items, direction) {
  if (!items.length) {
    const label = direction === "down" ? "turun" : "naik atau stabil";
    return `<tr><td colspan="6">Tidak ada parameter bernilai yang ${label} hari ini.</td></tr>`;
  }

  const mainItems = items.filter((item) => item.mainParameter);
  const otherItems = items.filter((item) => !item.mainParameter);
  const sectionRow = (label) => `
    <tr class="movement-section-row">
      <td colspan="6">${label}</td>
    </tr>
  `;
  const itemRows = (sectionItems) =>
    sectionItems
      .map(({ row, growth, mainParameter }) => {
      const unit = metricUnitForRow(row);
        const trend = directionalGrowth(row, growth);
        const growthClass = trend < 0 ? "minus" : trend > 0 ? "plus" : "";
      return `
        <tr>
            <td>${mainParameter?.label ?? cleanText(row.nama)}</td>
            <td class="${growthClass}">${formatFullMetric(growth, mainParameter?.unit ?? unit)}</td>
          <td>${formatFullMetric(row.realisasi, unit).replace(/^\+/, "")}</td>
          <td>${formatNumber(toNumber(row.rank_indikator), 0)}</td>
          <td>${formatNumber(toNumber(row.score))}</td>
          <td class="${toNumber(row.pencapaian) < 100 ? "weight-watch" : ""}">${formatNumber(toNumber(row.bobot), 0)}</td>
        </tr>
      `;
    })
    .join("");

  return [
    mainItems.length ? sectionRow("Parameter Utama") + itemRows(mainItems) : "",
    otherItems.length
      ? sectionRow(direction === "down" ? "Parameter Lainnya Turun" : "Parameter Lainnya Naik / Stabil") +
        itemRows(otherItems)
      : "",
  ].join("");
}

function branchOptions(units, kanwilUnits) {
  const kanwil = kanwilUnits.find((unit) => unit.rawCode === CONFIG.regionCode);
  const kanwilOption = `<option value="KW:${CONFIG.regionCode}">905 - KANWIL JATENG DAN DIY (Kanwil Nasional, Rank ${formatNumber(kanwil?.rank, 0)}/${formatNumber(kanwilUnits.length, 0)})</option>`;
  const branchOptionsHtml = units
    .filter((unit) => unit.regionCode === CONFIG.regionCode)
    .sort((a, b) => String(a.code).localeCompare(String(b.code), "id", { numeric: true }))
    .map((unit) => {
      const classTotal = units.filter((peer) => peer.className === unit.className).length;
      return `<option value="${unit.code}">${unitLabel(unit)} (${unit.className}, Rank ${formatNumber(unit.rank, 0)}/${formatNumber(classTotal, 0)})</option>`;
    })
    .join("");
  return `${kanwilOption}${branchOptionsHtml}`;
}

function renderDashboard(selectedCode) {
  const isKanwil = selectedCode.startsWith("KW:");
  const sourceRows = isKanwil ? appState.kanwilRows : appState.branchRows;
  const units = isKanwil ? appState.kanwilUnits : appState.branchUnits;
  const { latest } = appState;
  const selected = units.find((unit) => unit.code === selectedCode);
  if (!selected) throw new Error("Unit terpilih tidak ditemukan.");

  const classUnits = units
    .filter((unit) => isKanwil || unit.className === selected.className)
    .sort((a, b) => a.rank - b.rank || b.score - a.score);
  assignGrowthRanks(classUnits);
  const totalPeers = classUnits.length;

  const above = classUnits.find((unit) => unit.rank === selected.rank - 1);
  const below = classUnits.find((unit) => unit.rank === selected.rank + 1);
  const leaderScore = classUnits[0]?.score ?? selected.score;

  const selectedCompareCode = isKanwil ? selected.rawCode : selected.code;
  const aboveCompareCode = above ? (isKanwil ? above.rawCode : above.code) : null;
  const belowCompareCode = below ? (isKanwil ? below.rawCode : below.code) : null;
  const aboveComparison = above ? compareByIndicator(sourceRows, selectedCompareCode, aboveCompareCode) : [];
  const belowComparison = below ? compareByIndicator(sourceRows, selectedCompareCode, belowCompareCode) : [];
  const lossesToAbove = aboveComparison
    .filter((item) => item.gap < 0)
    .sort((a, b) => a.gap - b.gap);
  const risksFromBelow = belowComparison
    .filter((item) => item.gap < 0)
    .sort((a, b) => a.gap - b.gap);
  const buffersVsBelow = belowComparison
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap);

  const gapAbove = above ? selected.score - above.score : null;
  const gapBelow = below ? selected.score - below.score : null;
  const painPoints = topPainPoints([...lossesToAbove, ...risksFromBelow], 3);
  const critical = strongestCritical(painPoints);
  const aboveTight = gapAbove !== null && Math.abs(gapAbove) <= 0.5;
  const belowTight = gapBelow !== null && gapBelow <= 0.5;
  const selectedNote = [
    above
      ? aboveTight
        ? `Sangat dekat dengan rank atas: gap ${formatSigned(gapAbove)}.`
        : `Gap ke rank atas ${formatSigned(gapAbove)}.`
      : "Sudah berada di posisi tertinggi pada kelompok pembanding.",
    below
      ? belowTight
        ? `Rawan tersalip: jarak rank bawah hanya ${formatSigned(gapBelow)}.`
        : `Jarak rank bawah ${formatSigned(gapBelow)}.`
      : "Tidak ada rank bawah langsung.",
  ].join(" ");

  $("dataStamp").textContent = `Periode ${formatDateId(latest.processDate)}`;
  $("classNote").textContent = isKanwil
    ? `${unitLabel(selected)} berada di rank ${formatNumber(selected.rank, 0)} dari ${formatNumber(totalPeers, 0)} Kanwil nasional.`
    : `${unitLabel(selected)} berada di rank ${formatNumber(selected.rank, 0)} dari ${formatNumber(totalPeers, 0)} cabang nasional di ${selected.className}.`;
  $("sourceInfo").textContent = `Sumber: Google Sheets publik, ${sourceRows.length} baris ${isKanwil ? "Kanwil" : "cabang"} terbaru`;
  const selectedRows = sourceRows.filter((row) => row.kode_kantor === selectedCompareCode);
  const positiveGrowth = movementItems(selectedRows, "up");
  const negativeGrowth = movementItems(selectedRows, "down");
  const valuedParameters = selectedRows.filter(hasMetricValue);
  $("mainParameterTable").innerHTML = movementTableRows(positiveGrowth, "up");
  $("negativeGrowthTable").innerHTML = movementTableRows(negativeGrowth, "down");
  $("valuedParameterCount").textContent = `Total Parameter update ${formatNumber(valuedParameters.length, 0)} Parameter`;
  $("positiveGrowthCount").textContent = `${formatNumber(positiveGrowth.length, 0)} Parameter aktif`;
  $("negativeGrowthCount").textContent = `${formatNumber(negativeGrowth.length, 0)} parameter`;

  $("aboveCard").innerHTML = rankCard(above, {
    modifier: above ? "Rank atas" : "Sudah rank tertinggi",
    referenceScore: leaderScore,
    totalPeers,
    gap: gapAbove,
    role: "above",
    showGrowth: true,
    note: above
      ? `${unitLabel(selected)} perlu ${formatNumber(Math.abs(gapAbove))} score untuk menyamai posisi ini.`
      : "",
  });
  $("meCard").innerHTML = rankCard(selected, {
    modifier: isKanwil ? "Default Kanwil" : "Unit terpilih",
    referenceScore: leaderScore,
    totalPeers,
    gap: null,
    note: selectedNote,
    showGrowth: true,
  });
  $("belowCard").innerHTML = rankCard(below, {
    modifier: below ? "Rank bawah" : "Tidak ada rank bawah",
    referenceScore: leaderScore,
    totalPeers,
    gap: gapBelow,
    role: "below",
    showGrowth: true,
    note: below
      ? `${belowTight ? "Perlu dijaga ketat" : "Bantalan masih ada"} terhadap ${unitLabel(below)}.`
      : "",
  });

  $("criticalPoint").textContent = painPoints.length ? "3 Parameter Utama" : "-";
  $("criticalLabel").innerHTML = `${icon("alert")}Pain Point`;
  $("criticalText").textContent = critical
    ? `Gap terbesar: ${critical.name} (${formatSigned(critical.gap)} score).`
    : "Belum ada titik kritis yang terbaca.";
  $("criticalTable").innerHTML = painPointRows(painPoints);

  $("aboveTitle").textContent = above
    ? `Tekanan Ke ${unitLabel(above)}`
    : "Tidak Ada Rank Di Atas";
  $("aboveTag").textContent = above
    ? `Rank ${formatNumber(above.rank, 0)} dari ${formatNumber(totalPeers, 0)}`
    : selected.className;
  $("aboveScoreHead").textContent = above
    ? `Score ${unitCode(above)}`
    : "Score Lawan";
  $("aboveMeScoreHead").textContent = `Score ${unitCode(selected)}`;
  $("aboveTable").innerHTML = tableRows(lossesToAbove);

  $("belowTitle").textContent = below
    ? `Ancaman Dari ${unitLabel(below)}`
    : "Tidak Ada Rank Di Bawah";
  $("belowTag").textContent = below
    ? `Rank ${formatNumber(below.rank, 0)} dari ${formatNumber(totalPeers, 0)}`
    : selected.className;
  $("belowScoreHead").textContent = below
    ? `Score ${unitCode(below)}`
    : "Score Lawan";
  $("belowMeScoreHead").textContent = `Score ${unitCode(selected)}`;
  $("belowRiskTable").innerHTML = tableRows(risksFromBelow);

  $("bufferTitle").textContent = below
    ? `Penyangga Terhadap ${unitLabel(below)}`
    : "Penyangga Posisi";
  $("bufferScoreHead").textContent = below
    ? `Score ${unitCode(below)}`
    : "Score Lawan";
  $("bufferMeScoreHead").textContent = `Score ${unitCode(selected)}`;
  $("bufferTable").innerHTML = tableRows(buffersVsBelow);

  const topAttack = lossesToAbove[0];
  const topRisk = risksFromBelow[0];
  const topBuffer = buffersVsBelow[0];
  const peerLabel = isKanwil ? "Kanwil nasional" : `cabang nasional ${selected.className}`;
  const riskTriggers = risksFromBelow.slice(0, 2);
  const attackTriggers = lossesToAbove.slice(0, 2);
  const riskTriggerText =
    below && riskTriggers.length
      ? `Jika tersusul oleh ${unitLabel(below)}, pemicunya paling mungkin ${riskTriggers
          .map((item) => `${item.name} (gap ${formatSigned(item.gap)} score)`)
          .join(" dan ")}.`
      : "Risiko tersusul langsung belum dominan karena tidak ada parameter utama yang kalah dari rank bawah.";
  const attackTriggerText =
    above && attackTriggers.length
      ? `Untuk mengejar ${unitLabel(above)}, celah terbesar ada pada ${attackTriggers
          .map((item) => `${item.name} (gap ${formatSigned(item.gap)} score)`)
          .join(" dan ")}.`
      : "Tekanan ke rank atas relatif terkendali karena tidak ada gap negatif dominan pada parameter utama.";
  const criticalText = critical
    ? `Pain point utama adalah ${critical.name}: rank parameter ${formatNumber(critical.selectedRank, 0)}, target ${formatMetricValue(critical.name, critical.target)}, realisasi ${formatMetricValue(critical.name, critical.realization)}, dan capaian ${formatMetricValue(critical.name, critical.achievement, "achievement")}.`
    : "Pain point utama belum terbaca kuat dari parameter pembanding saat ini.";
  const aboveNarrative = above
    ? `Posisi tepat di atas ditempati ${unitLabel(above)} dengan gap ${formatSigned(gapAbove)} score. Tekanan terbesar untuk mengejar berasal dari ${topAttack?.name ?? "indikator utama"}${topAttack ? `, dengan selisih ${formatSigned(topAttack.gap)} score` : ""}.`
    : "Unit ini sudah berada di posisi tertinggi pada kelompok pembandingnya.";
  const belowNarrative = below
    ? `Di bawahnya, ${unitLabel(below)} berjarak ${formatSigned(gapBelow)} score. Risiko terbesar muncul pada ${topRisk?.name ?? "indikator yang masih tertinggal"}${topRisk ? ` karena lawan unggul ${formatNumber(Math.abs(topRisk.gap))} score` : ""}.`
    : "Tidak ada unit tepat di bawah posisi ini, sehingga fokus bergeser ke mempertahankan konsistensi score.";
  const bufferNarrative = topBuffer
    ? `Bantalan utama saat ini adalah ${topBuffer.name}, dengan keunggulan ${formatSigned(topBuffer.gap)} score terhadap pembanding bawah.`
    : "Bantalan score belum dominan, sehingga perlu memperbesar keunggulan pada indikator yang sudah positif.";
  const executionNarrative =
    topAttack || topRisk || topBuffer
      ? `Arah eksekusi paling rasional adalah menutup gap terbesar lebih dulu, mengamankan parameter yang bisa membuat posisi tersusul, lalu menjaga bantalan score yang sudah unggul agar tidak ikut tergerus.`
      : "Arah eksekusi utama adalah menjaga konsistensi score harian dan memperbesar indikator yang masih memberi ruang kenaikan.";
  const narrativeItem = (label, text) => `
    <div class="narrative-item">
      <span>${escapeHtml(label)}</span>
      <p>${escapeHtml(text)}</p>
    </div>
  `;

  $("executiveNarrative").innerHTML = `
    ${narrativeItem("Posisi", `${unitLabel(selected)} berada di rank ${formatNumber(selected.rank, 0)} dari ${formatNumber(totalPeers, 0)} ${peerLabel} dengan score ${formatNumber(selected.score)}.`)}
    ${narrativeItem("Tekanan rank atas", `${aboveNarrative} ${attackTriggerText}`)}
    ${narrativeItem("Risiko tersusul", `${belowNarrative} ${riskTriggerText}`)}
    ${narrativeItem("Pain point", criticalText)}
    ${narrativeItem("Arah eksekusi", `${bufferNarrative} ${executionNarrative}`)}
  `;

  $("actions").innerHTML = [
    {
      icon: "attack",
      title: "Kejar rank atas",
      text:
        above && topAttack
          ? `Naikkan ${topAttack.name}; gap terbesar ke ${unitLabel(above)} adalah ${formatSigned(topAttack.gap)} score.`
          : `Pertahankan posisi puncak ${selected.className}.`,
    },
    {
      icon: "shield",
      title: "Cegah tersusul",
      text:
        below && topRisk
          ? `Tutup ${topRisk.name}; ${unitLabel(below)} unggul ${formatNumber(Math.abs(topRisk.gap))} score pada indikator ini.`
          : "Belum ada indikator utama yang tertinggal dari rank bawah.",
    },
    {
      icon: "score",
      title: "Jaga bantalan",
      text:
        below && topBuffer
          ? `Pertahankan ${topBuffer.name}; bantalan terbesar saat ini ${formatSigned(topBuffer.gap)} score.`
          : "Perbesar bantalan score pada indikator unggulan.",
    },
  ]
    .map(
      (action) => `
        <div class="action">
          <strong>${icon(action.icon)}${action.title}</strong>
          <p>${action.text}</p>
        </div>
      `,
    )
    .join("");

  $("verdict").textContent = critical
    ? `Kesimpulan: ${unitLabel(selected)} berada di rank ${formatNumber(selected.rank, 0)} dari ${formatNumber(totalPeers, 0)} ${isKanwil ? "Kanwil nasional" : `cabang nasional ${selected.className}`}. ${critical.name} menjadi titik paling menentukan untuk mengejar rank atas sekaligus menahan risiko dari rank bawah. ${riskTriggerText}`
    : `Kesimpulan: ${unitLabel(selected)} berada di rank ${formatNumber(selected.rank, 0)} dari ${formatNumber(totalPeers, 0)} ${isKanwil ? "Kanwil nasional" : `cabang nasional ${selected.className}`}; fokus utama adalah menjaga indikator penyangga agar posisi tetap aman. ${riskTriggerText}`;
}

async function loadDashboard() {
  try {
    const response = await fetch(`${CONFIG.sourceUrl}&cacheBust=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const csv = await response.text();
    const allRows = parseCsv(csv);
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
    const regionBranches = branchUnits.filter((unit) => unit.regionCode === CONFIG.regionCode);
    if (!regionBranches.length) throw new Error("Cabang jajaran 905 tidak ditemukan.");

    appState = {
      branchRows,
      kanwilRows,
      latest: { period, processDate },
      branchUnits,
      kanwilUnits,
    };

    $("unitSelect").innerHTML = branchOptions(branchUnits, kanwilUnits);
    $("unitSelect").value = CONFIG.defaultUnitCode;
    $("unitSelect").addEventListener("change", (event) => {
      renderDashboard(event.target.value);
    });

    $("refreshStatus").textContent = `Terakhir dimuat ${new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    renderDashboard(CONFIG.defaultUnitCode);
    $("loadingState").classList.add("hidden");
    $("dashboardContent").classList.remove("hidden");
  } catch (error) {
    $("loadingState").classList.add("hidden");
    $("errorState").classList.remove("hidden");
    $("errorMessage").textContent = error.message;
  }
}

loadDashboard();

$("printBtn")?.addEventListener("click", () => {
  window.print();
});

$("exportJpgBtn")?.addEventListener("click", async () => {
  const button = $("exportJpgBtn");
  const dashboard = document.querySelector(".dashboard");
  if (!window.html2canvas || !dashboard) return;

  const originalText = button.textContent;
  button.textContent = "Exporting...";
  button.disabled = true;
  document.body.classList.add("is-exporting");

  try {
    const exportScale = Math.min(4, Math.max(3, window.devicePixelRatio || 2));
    const canvas = await window.html2canvas(dashboard, {
      backgroundColor: "#eef6f4",
      scale: exportScale,
      useCORS: true,
      logging: false,
      imageTimeout: 30000,
    });
    const marginCm = 1;
    const marginPx = Math.round((96 / 2.54) * marginCm * exportScale);
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width + marginPx * 2;
    exportCanvas.height = canvas.height + marginPx * 2;
    const context = exportCanvas.getContext("2d");
    context.fillStyle = "#eef6f4";
    context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    context.drawImage(canvas, marginPx, marginPx);

    const link = document.createElement("a");
    const unit = $("unitSelect")?.value?.replace("KW:", "KANWIL-") || "dashboard";
    const date = new Date().toISOString().slice(0, 10);
    link.download = `dashboard-kpi-${unit}-${date}.jpg`;
    link.href = exportCanvas.toDataURL("image/jpeg", 0.98);
    link.click();
  } finally {
    document.body.classList.remove("is-exporting");
    button.disabled = false;
    button.textContent = originalText;
  }
});
