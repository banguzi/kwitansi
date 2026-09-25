(function () {
  "use strict";

  const PREF_KEY = "thermal-dokumen-prefs-v1";
  const DRAFT_KEY = "thermal-dokumen-drafts-v1";

  const DOC_TYPES = [
    { id: "kwitansi", label: "Kwitansi" },
    { id: "nota", label: "Nota" },
    { id: "bon", label: "Bon" },
    { id: "bukti-pembayaran", label: "Bukti Pembayaran" },
    { id: "serah-terima", label: "Bukti Serah Terima Uang" }
  ];

  const SATUAN = ["pcs", "bh", "lsn", "pack", "box", "kg", "gr", "liter", "m", "jasa"];

  const defaultPrefs = {
    namaUsaha: "TOKO MAJU JAYA",
    alamat: "Jl. Merdeka No. 10, Surabaya",
    telepon: "0812-0000-0000",
    npwp: "",
    footer: "Terima kasih. Barang yang sudah dibeli tidak dapat dikembalikan.",
    contentWidthMm: 50,
    showTerbilang: true,
    showHeader: true
  };

  const state = {
    type: "kwitansi",
    prefs: loadPrefs(),
    fields: emptyFields("kwitansi"),
    items: [emptyItem()],
    errors: {}
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      return raw ? Object.assign({}, defaultPrefs, JSON.parse(raw)) : Object.assign({}, defaultPrefs);
    } catch (err) {
      return Object.assign({}, defaultPrefs);
    }
  }

  function savePrefs() {
    localStorage.setItem(PREF_KEY, JSON.stringify(state.prefs));
  }

  function loadDrafts() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveDrafts(list) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(list));
  }

  function emptyItem() {
    return { nama: "", qty: 1, satuan: "pcs", harga: 0 };
  }

  function emptyFields(type) {
    const today = todayISO();
    const nomor = makeNumber(type);
    const base = {
      nomor: nomor,
      tanggal: today,
      tempat: "Surabaya",
      catatan: ""
    };
    if (type === "kwitansi") {
      return Object.assign(base, {
        diterimaDari: "",
        jumlah: 0,
        untukPembayaran: "",
        pemberiNama: "",
        penerimaNama: ""
      });
    }
    if (type === "nota" || type === "bon") {
      return Object.assign(base, {
        pelanggan: "",
        diskon: 0,
        pajakPersen: 0,
        petugas: ""
      });
    }
    if (type === "bukti-pembayaran") {
      return Object.assign(base, {
        pembayar: "",
        penerima: "",
        jumlah: 0,
        metode: "Tunai",
        referensi: "",
        untukPembayaran: ""
      });
    }
    return Object.assign(base, {
      penyerahNama: "",
      penyerahIdentitas: "",
      penerimaNama: "",
      penerimaIdentitas: "",
      jumlah: 0,
      keperluan: "",
      saksi1: "",
      saksi2: ""
    });
  }

  function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function makeNumber(type) {
    const map = {
      kwitansi: "KW",
      nota: "NT",
      bon: "BN",
      "bukti-pembayaran": "BP",
      "serah-terima": "ST"
    };
    const d = new Date();
    const stamp =
      String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      String(d.getHours()).padStart(2, "0") +
      String(d.getMinutes()).padStart(2, "0");
    return (map[type] || "DOC") + "-" + stamp;
  }

  function parseMoney(value) {
    if (typeof value === "number" && isFinite(value)) return Math.round(value);
    const digits = String(value || "").replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  function formatRupiah(value, withPrefix) {
    const n = parseMoney(value);
    const formatted = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return withPrefix ? "Rp " + formatted : formatted;
  }

  function terbilang(n) {
    n = parseMoney(n);
    if (n === 0) return "Nol Rupiah";
    const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"];
    function three(num) {
      let text = "";
      const ratus = Math.floor(num / 100);
      const puluh = Math.floor((num % 100) / 10);
      const satu = num % 10;
      if (ratus > 0) text += ratus === 1 ? "Seratus " : satuan[ratus] + " Ratus ";
      if (puluh === 1) {
        text += satu === 0 ? "Sepuluh " : satu === 1 ? "Sebelas " : satuan[satu] + " Belas ";
      } else {
        if (puluh > 1) text += satuan[puluh] + " Puluh ";
        if (satu > 0) text += satuan[satu] + " ";
      }
      return text;
    }
    const parts = [];
    const milyar = Math.floor(n / 1000000000);
    const juta = Math.floor((n % 1000000000) / 1000000);
    const ribu = Math.floor((n % 1000000) / 1000);
    const sisa = n % 1000;
    if (milyar) parts.push((milyar === 1 ? "Satu " : three(milyar)) + "Miliar");
    if (juta) parts.push(three(juta) + "Juta");
    if (ribu) parts.push(ribu === 1 ? "Seribu" : three(ribu) + "Ribu");
    if (sisa) parts.push(three(sisa).trim());
    return parts.join(" ").replace(/\s+/g, " ").trim() + " Rupiah";
  }

  function formatDateID(iso) {
    if (!iso) return "-";
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function dash(text) {
    const t = String(text || "").trim();
    return t || "-";
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function wrapDash(text, width) {
    const raw = String(text || "");
    if (raw.length <= width) return raw;
    return raw.slice(0, width);
  }

  function itemTotals() {
    const rows = state.items.map(function (item) {
      const qty = Number(item.qty) || 0;
      const harga = parseMoney(item.harga);
      const sub = Math.round(qty * harga);
      return Object.assign({}, item, { qty: qty, harga: harga, sub: sub });
    });
    const subtotal = rows.reduce(function (sum, row) {
      return sum + row.sub;
    }, 0);
    const diskon = parseMoney(state.fields.diskon);
    const afterDiskon = Math.max(0, subtotal - diskon);
    const pajakPersen = Number(state.fields.pajakPersen) || 0;
    const pajak = Math.round(afterDiskon * (pajakPersen / 100));
    const total = afterDiskon + pajak;
    return { rows: rows, subtotal: subtotal, diskon: diskon, pajak: pajak, total: total };
  }

  function documentAmount() {
    if (state.type === "nota" || state.type === "bon") return itemTotals().total;
    return parseMoney(state.fields.jumlah);
  }

  function validate() {
    const errors = {};
    const f = state.fields;
    if (!String(f.nomor || "").trim()) errors.nomor = "Nomor dokumen wajib diisi.";
    if (!f.tanggal) errors.tanggal = "Tanggal wajib diisi.";

    if (state.type === "kwitansi") {
      if (!String(f.diterimaDari || "").trim()) errors.diterimaDari = "Nama pemberi dana wajib diisi.";
      if (parseMoney(f.jumlah) <= 0) errors.jumlah = "Jumlah harus lebih dari 0.";
      if (!String(f.untukPembayaran || "").trim()) errors.untukPembayaran = "Uraian pembayaran wajib diisi.";
      if (!String(f.penerimaNama || "").trim()) errors.penerimaNama = "Nama penerima wajib diisi.";
    }

    if (state.type === "nota" || state.type === "bon") {
      const named = state.items.filter(function (item) {
        return String(item.nama || "").trim();
      });
      if (!named.length) errors.items = "Minimal satu barang/jasa harus diisi.";
      else if (itemTotals().total <= 0) errors.items = "Total nota/bon harus lebih dari 0.";
    }

    if (state.type === "bukti-pembayaran") {
      if (!String(f.pembayar || "").trim()) errors.pembayar = "Nama pembayar wajib diisi.";
      if (!String(f.penerima || "").trim()) errors.penerima = "Nama penerima wajib diisi.";
      if (parseMoney(f.jumlah) <= 0) errors.jumlah = "Jumlah harus lebih dari 0.";
      if (!String(f.untukPembayaran || "").trim()) errors.untukPembayaran = "Keterangan pembayaran wajib diisi.";
    }

    if (state.type === "serah-terima") {
      if (!String(f.penyerahNama || "").trim()) errors.penyerahNama = "Nama pihak yang menyerahkan wajib diisi.";
      if (!String(f.penerimaNama || "").trim()) errors.penerimaNama = "Nama pihak yang menerima wajib diisi.";
      if (parseMoney(f.jumlah) <= 0) errors.jumlah = "Jumlah uang wajib lebih dari 0.";
      if (!String(f.keperluan || "").trim()) errors.keperluan = "Keperluan serah terima wajib diisi.";
    }

    state.errors = errors;
    return Object.keys(errors).length === 0;
  }

  function headerHtml() {
    if (!state.prefs.showHeader) return "";
    return (
      '<div class="doc-block doc-center">' +
      '<div class="doc-strong">' +
      escapeHtml(wrapDash(state.prefs.namaUsaha || "USAHA", 32)) +
      "</div>" +
      (state.prefs.alamat ? "<div>" + escapeHtml(state.prefs.alamat) + "</div>" : "") +
      (state.prefs.telepon ? "<div>Telp. " + escapeHtml(state.prefs.telepon) + "</div>" : "") +
      (state.prefs.npwp ? "<div>NPWP " + escapeHtml(state.prefs.npwp) + "</div>" : "") +
      "</div>"
    );
  }

  function moneyLine(label, value, strong) {
    return (
      '<div class="' +
      (strong ? "doc-strong " : "") +
      '" style="display:flex;justify-content:space-between;gap:6px;">' +
      "<span>" +
      escapeHtml(label) +
      "</span><span>" +
      escapeHtml(formatRupiah(value, true)) +
      "</span></div>"
    );
  }

  function renderDocument() {
    const f = state.fields;
    const typeLabel = DOC_TYPES.find(function (d) {
      return d.id === state.type;
    }).label;
    let body = headerHtml();
    body += '<hr class="doc-line">';
    body += '<div class="doc-block doc-center"><div class="doc-title">' + escapeHtml(typeLabel.toUpperCase()) + "</div></div>";
    body +=
      '<div class="doc-block">' +
      "<div>No. " +
      escapeHtml(dash(f.nomor)) +
      "</div>" +
      "<div>Tgl. " +
      escapeHtml(formatDateID(f.tanggal)) +
      "</div>" +
      "</div>";
    body += '<hr class="doc-line">';

    if (state.type === "kwitansi") {
      body +=
        '<div class="doc-block">' +
        "<div>Sudah diterima dari:</div>" +
        '<div class="doc-strong">' +
        escapeHtml(dash(f.diterimaDari)) +
        "</div>" +
        "<div style='margin-top:6px;'>Uang sejumlah:</div>" +
        '<div class="doc-strong">' +
        escapeHtml(formatRupiah(f.jumlah, true)) +
        "</div>" +
        (state.prefs.showTerbilang
          ? "<div>(" + escapeHtml(terbilang(f.jumlah)) + ")</div>"
          : "") +
        "<div style='margin-top:6px;'>Untuk pembayaran:</div>" +
        "<div>" +
        escapeHtml(dash(f.untukPembayaran)) +
        "</div>" +
        "</div>";
      body += '<hr class="doc-line">';
      body +=
        '<div class="doc-block sign-row">' +
        '<div class="sign-box"><div>Penyetor</div><div class="sign-space"></div><div>' +
        escapeHtml(dash(f.pemberiNama || f.diterimaDari)) +
        "</div></div>" +
        '<div class="sign-box"><div>Penerima</div><div class="sign-space"></div><div>' +
        escapeHtml(dash(f.penerimaNama)) +
        "</div></div>" +
        "</div>";
    }

    if (state.type === "nota" || state.type === "bon") {
      const calc = itemTotals();
      body +=
        '<div class="doc-block">' +
        "<div>Pelanggan: " +
        escapeHtml(dash(f.pelanggan)) +
        "</div>" +
        "</div>";
      body += '<hr class="doc-line">';
      body +=
        '<div class="doc-block"><table class="item-table"><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Jumlah</th></tr></thead><tbody>';
      calc.rows.forEach(function (row) {
        if (!String(row.nama || "").trim() && row.sub === 0) return;
        body +=
          "<tr><td>" +
          escapeHtml(row.nama || "-") +
          "<br>" +
          escapeHtml(formatRupiah(row.harga, true)) +
          "/" +
          escapeHtml(row.satuan || "pcs") +
          '</td><td class="num">' +
          escapeHtml(String(row.qty)) +
          '</td><td class="num">' +
          escapeHtml(formatRupiah(row.sub, false)) +
          "</td></tr>";
      });
      body += "</tbody></table></div>";
      body += '<hr class="doc-line">';
      body += '<div class="doc-block">';
      body += moneyLine("Subtotal", calc.subtotal, false);
      if (calc.diskon > 0) body += moneyLine("Diskon", calc.diskon, false);
      if (calc.pajak > 0) body += moneyLine("Pajak " + (Number(f.pajakPersen) || 0) + "%", calc.pajak, false);
      body += moneyLine("TOTAL", calc.total, true);
      if (state.prefs.showTerbilang) {
        body += "<div>(" + escapeHtml(terbilang(calc.total)) + ")</div>";
      }
      body += "</div>";
      if (f.catatan) {
        body += '<hr class="doc-line"><div class="doc-block">Catatan:<br>' + escapeHtml(f.catatan) + "</div>";
      }
      body +=
        '<div class="doc-block sign-row"><div class="sign-box"><div>Pelanggan</div><div class="sign-space"></div><div>' +
        escapeHtml(dash(f.pelanggan)) +
        '</div></div><div class="sign-box"><div>Petugas</div><div class="sign-space"></div><div>' +
        escapeHtml(dash(f.petugas)) +
        "</div></div></div>";
    }

    if (state.type === "bukti-pembayaran") {
      body +=
        '<div class="doc-block">' +
        "<div>Pembayar:<br><span class='doc-strong'>" +
        escapeHtml(dash(f.pembayar)) +
        "</span></div>" +
        "<div style='margin-top:6px;'>Penerima:<br><span class='doc-strong'>" +
        escapeHtml(dash(f.penerima)) +
        "</span></div>" +
        "<div style='margin-top:6px;'>Jumlah:<br><span class='doc-strong'>" +
        escapeHtml(formatRupiah(f.jumlah, true)) +
        "</span></div>" +
        (state.prefs.showTerbilang ? "<div>(" + escapeHtml(terbilang(f.jumlah)) + ")</div>" : "") +
        "<div style='margin-top:6px;'>Metode: " +
        escapeHtml(dash(f.metode)) +
        "</div>" +
        (f.referensi ? "<div>Ref: " + escapeHtml(f.referensi) + "</div>" : "") +
        "<div style='margin-top:6px;'>Untuk:<br>" +
        escapeHtml(dash(f.untukPembayaran)) +
        "</div>" +
        "</div>";
      body += '<hr class="doc-line">';
      body +=
        '<div class="doc-block sign-row"><div class="sign-box"><div>Pembayar</div><div class="sign-space"></div><div>' +
        escapeHtml(dash(f.pembayar)) +
        '</div></div><div class="sign-box"><div>Penerima</div><div class="sign-space"></div><div>' +
        escapeHtml(dash(f.penerima)) +
        "</div></div></div>";
    }

    if (state.type === "serah-terima") {
      body +=
        '<div class="doc-block">' +
        "<div>Telah diserahkan uang sebesar:</div>" +
        '<div class="doc-strong">' +
        escapeHtml(formatRupiah(f.jumlah, true)) +
        "</div>" +
        (state.prefs.showTerbilang ? "<div>(" + escapeHtml(terbilang(f.jumlah)) + ")</div>" : "") +
        "<div style='margin-top:6px;'>Keperluan:<br>" +
        escapeHtml(dash(f.keperluan)) +
        "</div>" +
        "<div style='margin-top:6px;'>Yang menyerahkan:<br><span class='doc-strong'>" +
        escapeHtml(dash(f.penyerahNama)) +
        "</span>" +
        (f.penyerahIdentitas ? "<br>ID: " + escapeHtml(f.penyerahIdentitas) : "") +
        "</div>" +
        "<div style='margin-top:6px;'>Yang menerima:<br><span class='doc-strong'>" +
        escapeHtml(dash(f.penerimaNama)) +
        "</span>" +
        (f.penerimaIdentitas ? "<br>ID: " + escapeHtml(f.penerimaIdentitas) : "") +
        "</div>" +
        "</div>";
      body += '<hr class="doc-line">';
      body +=
        '<div class="doc-block">' +
        "<div>" +
        escapeHtml(dash(f.tempat)) +
        ", " +
        escapeHtml(formatDateID(f.tanggal)) +
        "</div></div>";
      body +=
        '<div class="doc-block sign-row"><div class="sign-box"><div>Penyerah</div><div class="sign-space"></div><div>' +
        escapeHtml(dash(f.penyerahNama)) +
        '</div></div><div class="sign-box"><div>Penerima</div><div class="sign-space"></div><div>' +
        escapeHtml(dash(f.penerimaNama)) +
        "</div></div></div>";
      if (f.saksi1 || f.saksi2) {
        body +=
          '<div class="doc-block sign-row"><div class="sign-box"><div>Saksi 1</div><div class="sign-space"></div><div>' +
          escapeHtml(dash(f.saksi1)) +
          '</div></div><div class="sign-box"><div>Saksi 2</div><div class="sign-space"></div><div>' +
          escapeHtml(dash(f.saksi2)) +
          "</div></div></div>";
      }
    }

    if (state.prefs.footer) {
      body += '<hr class="doc-line"><div class="doc-block doc-center">' + escapeHtml(state.prefs.footer) + "</div>";
    }
    return body;
  }

  function applyPrintWidth() {
    const mm = Math.min(52, Math.max(48, Number(state.prefs.contentWidthMm) || 50));
    state.prefs.contentWidthMm = mm;
    document.documentElement.style.setProperty("--print-content-width", mm + "mm");
    if (els.widthValue) els.widthValue.textContent = mm + " mm";
  }

  function renderPreview() {
    if (!els.printRoot) return;
    els.printRoot.innerHTML = renderDocument();
  }

  function fieldBlock(id, label, controlHtml) {
    const err = state.errors[id];
    return (
      '<div class="' +
      (err ? "field-error" : "") +
      '"><label for="' +
      id +
      '">' +
      escapeHtml(label) +
      "</label>" +
      controlHtml +
      (err ? '<div class="error-text">' + escapeHtml(err) + "</div>" : "") +
      "</div>"
    );
  }

  function inputHtml(id, type, extra) {
    const val = state.fields[id] == null ? "" : state.fields[id];
    const display =
      (id === "jumlah" || id === "diskon") && type === "text" ? formatRupiah(val, false) : val;
    return (
      '<input id="' +
      id +
      '" data-field="' +
      id +
      '" type="' +
      type +
      '" value="' +
      escapeHtml(String(display)) +
      '" ' +
      (extra || "") +
      ">"
    );
  }

  function renderForm() {
    const type = state.type;
    let html = '<div class="grid-2">';
    html += fieldBlock("nomor", "Nomor dokumen", inputHtml("nomor", "text", "autocomplete='off'"));
    html += fieldBlock("tanggal", "Tanggal", inputHtml("tanggal", "date"));
    html += "</div>";

    if (type === "kwitansi") {
      html += fieldBlock("diterimaDari", "Diterima dari", inputHtml("diterimaDari", "text"));
      html += fieldBlock("jumlah", "Jumlah (Rp)", inputHtml("jumlah", "text", "inputmode='numeric'"));
      html += fieldBlock(
        "untukPembayaran",
        "Untuk pembayaran",
        '<textarea id="untukPembayaran" data-field="untukPembayaran">' +
          escapeHtml(state.fields.untukPembayaran || "") +
          "</textarea>"
      );
      html += '<div class="grid-2">';
      html += fieldBlock("pemberiNama", "Nama penyetor (opsional)", inputHtml("pemberiNama", "text"));
      html += fieldBlock("penerimaNama", "Nama penerima", inputHtml("penerimaNama", "text"));
      html += "</div>";
    }

    if (type === "nota" || type === "bon") {
      html += fieldBlock("pelanggan", "Nama pelanggan", inputHtml("pelanggan", "text"));
      html += '<label>Daftar item</label><div class="item-editor" id="item-editor">';
      state.items.forEach(function (item, index) {
        html +=
          '<div class="item-row" data-index="' +
          index +
          '">' +
          '<div class="grid-3">' +
          '<div><label>Nama barang/jasa</label><input data-item="nama" data-index="' +
          index +
          '" type="text" value="' +
          escapeHtml(item.nama) +
          '"></div>' +
          '<div><label>Qty</label><input data-item="qty" data-index="' +
          index +
          '" type="number" min="0" step="0.01" value="' +
          escapeHtml(String(item.qty)) +
          '"></div>' +
          '<div><label>Satuan</label><select data-item="satuan" data-index="' +
          index +
          '">' +
          SATUAN.map(function (sat) {
            return (
              '<option value="' +
              sat +
              '"' +
              (item.satuan === sat ? " selected" : "") +
              ">" +
              sat +
              "</option>"
            );
          }).join("") +
          "</select></div>" +
          '<div><label>&nbsp;</label><button type="button" class="btn btn-ghost btn-small" data-remove-item="' +
          index +
          '">Hapus</button></div>' +
          "</div>" +
          '<div class="grid-2">' +
          '<div><label>Harga satuan (Rp)</label><input data-item="harga" data-index="' +
          index +
          '" type="text" inputmode="numeric" value="' +
          escapeHtml(formatRupiah(item.harga, false)) +
          '"></div>' +
          "<div><label>Subtotal</label><input type='text' value='" +
          escapeHtml(formatRupiah((Number(item.qty) || 0) * parseMoney(item.harga), true)) +
          "' readonly></div>" +
          "</div></div>";
      });
      html += "</div>";
      if (state.errors.items) html += '<div class="error-text">' + escapeHtml(state.errors.items) + "</div>";
      html +=
        '<div style="margin-top:8px;"><button type="button" class="btn btn-ghost btn-small" id="add-item">Tambah item</button></div>';
      if (type === "nota") {
        html += '<div class="grid-2">';
        html += fieldBlock("diskon", "Diskon (Rp)", inputHtml("diskon", "text", "inputmode='numeric'"));
        html += fieldBlock(
          "pajakPersen",
          "Pajak (%)",
          inputHtml("pajakPersen", "number", "min='0' max='100' step='0.1'")
        );
        html += "</div>";
      }
      html += fieldBlock("petugas", "Nama petugas", inputHtml("petugas", "text"));
      html += fieldBlock(
        "catatan",
        "Catatan",
        '<textarea id="catatan" data-field="catatan">' + escapeHtml(state.fields.catatan || "") + "</textarea>"
      );
    }

    if (type === "bukti-pembayaran") {
      html += '<div class="grid-2">';
      html += fieldBlock("pembayar", "Pembayar", inputHtml("pembayar", "text"));
      html += fieldBlock("penerima", "Penerima", inputHtml("penerima", "text"));
      html += "</div>";
      html += fieldBlock("jumlah", "Jumlah (Rp)", inputHtml("jumlah", "text", "inputmode='numeric'"));
      html +=
        fieldBlock(
          "metode",
          "Metode",
          '<select id="metode" data-field="metode">' +
            ["Tunai", "Transfer Bank", "QRIS", "Kartu Debit", "Kartu Kredit", "Lainnya"]
              .map(function (m) {
                return (
                  '<option value="' +
                  m +
                  '"' +
                  (state.fields.metode === m ? " selected" : "") +
                  ">" +
                  m +
                  "</option>"
                );
              })
              .join("") +
            "</select>"
        );
      html += fieldBlock("referensi", "No. referensi / rekening (opsional)", inputHtml("referensi", "text"));
      html += fieldBlock(
        "untukPembayaran",
        "Untuk pembayaran",
        '<textarea id="untukPembayaran" data-field="untukPembayaran">' +
          escapeHtml(state.fields.untukPembayaran || "") +
          "</textarea>"
      );
    }

    if (type === "serah-terima") {
      html += fieldBlock("tempat", "Tempat", inputHtml("tempat", "text"));
      html += fieldBlock("penyerahNama", "Yang menyerahkan", inputHtml("penyerahNama", "text"));
      html += fieldBlock("penyerahIdentitas", "Identitas penyerah (KTP/SIM, opsional)", inputHtml("penyerahIdentitas", "text"));
      html += fieldBlock("penerimaNama", "Yang menerima", inputHtml("penerimaNama", "text"));
      html += fieldBlock("penerimaIdentitas", "Identitas penerima (opsional)", inputHtml("penerimaIdentitas", "text"));
      html += fieldBlock("jumlah", "Jumlah uang (Rp)", inputHtml("jumlah", "text", "inputmode='numeric'"));
      html += fieldBlock(
        "keperluan",
        "Keperluan",
        '<textarea id="keperluan" data-field="keperluan">' +
          escapeHtml(state.fields.keperluan || "") +
          "</textarea>"
      );
      html += '<div class="grid-2">';
      html += fieldBlock("saksi1", "Saksi 1 (opsional)", inputHtml("saksi1", "text"));
      html += fieldBlock("saksi2", "Saksi 2 (opsional)", inputHtml("saksi2", "text"));
      html += "</div>";
    }

    els.formFields.innerHTML = html;
    bindFormEvents();
  }

  function bindFormEvents() {
    els.formFields.querySelectorAll("[data-field]").forEach(function (node) {
      const handler = function (ev) {
        const key = node.getAttribute("data-field");
        if (key === "jumlah" || key === "diskon") {
          state.fields[key] = parseMoney(ev.target.value);
          if (ev.type === "blur") ev.target.value = formatRupiah(state.fields[key], false);
        } else if (key === "pajakPersen") {
          state.fields[key] = ev.target.value === "" ? 0 : Number(ev.target.value);
        } else {
          state.fields[key] = ev.target.value;
        }
        renderPreview();
      };
      node.addEventListener("input", handler);
      node.addEventListener("change", handler);
      node.addEventListener("blur", handler);
    });

    els.formFields.querySelectorAll("[data-item]").forEach(function (node) {
      node.addEventListener("input", onItemChange);
      node.addEventListener("change", onItemChange);
      node.addEventListener("blur", onItemChange);
    });

    els.formFields.querySelectorAll("[data-remove-item]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const index = Number(btn.getAttribute("data-remove-item"));
        if (state.items.length === 1) {
          state.items = [emptyItem()];
        } else {
          state.items.splice(index, 1);
        }
        renderForm();
        renderPreview();
      });
    });

    const addBtn = $("add-item");
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        state.items.push(emptyItem());
        renderForm();
        renderPreview();
      });
    }
  }

  function onItemChange(ev) {
    const node = ev.target;
    const index = Number(node.getAttribute("data-index"));
    const key = node.getAttribute("data-item");
    if (!state.items[index]) return;
    if (key === "harga") {
      state.items[index].harga = parseMoney(node.value);
      if (ev.type === "blur") node.value = formatRupiah(state.items[index].harga, false);
    } else if (key === "qty") {
      state.items[index].qty = node.value === "" ? 0 : Number(node.value);
    } else {
      state.items[index][key] = node.value;
    }
    renderPreview();
    if (key === "harga" || key === "qty") {
      const row = node.closest(".item-row");
      if (row) {
        const sub = row.querySelector("input[readonly]");
        if (sub) {
          const item = state.items[index];
          sub.value = formatRupiah((Number(item.qty) || 0) * parseMoney(item.harga), true);
        }
      }
    }
  }

  function renderTabs() {
    els.tabs.innerHTML = DOC_TYPES.map(function (doc) {
      return (
        '<button class="tab" type="button" role="tab" data-type="' +
        doc.id +
        '" aria-selected="' +
        (state.type === doc.id ? "true" : "false") +
        '">' +
        escapeHtml(doc.label) +
        "</button>"
      );
    }).join("");
    els.tabs.querySelectorAll("[data-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        switchType(btn.getAttribute("data-type"));
      });
    });
  }

  function switchType(type) {
    state.type = type;
    state.fields = emptyFields(type);
    state.items = [emptyItem(), emptyItem()];
    state.errors = {};
    renderTabs();
    renderForm();
    renderPreview();
    renderDrafts();
  }

  function renderPrefs() {
    $("pref-nama").value = state.prefs.namaUsaha;
    $("pref-alamat").value = state.prefs.alamat;
    $("pref-telepon").value = state.prefs.telepon;
    $("pref-npwp").value = state.prefs.npwp;
    $("pref-footer").value = state.prefs.footer;
    $("pref-width").value = String(state.prefs.contentWidthMm);
    $("pref-terbilang").checked = !!state.prefs.showTerbilang;
    $("pref-header").checked = !!state.prefs.showHeader;
    applyPrintWidth();
  }

  function bindPrefs() {
    ["nama", "alamat", "telepon", "npwp", "footer"].forEach(function (key) {
      const map = {
        nama: "namaUsaha",
        alamat: "alamat",
        telepon: "telepon",
        npwp: "npwp",
        footer: "footer"
      };
      $("pref-" + key).addEventListener("input", function (ev) {
        state.prefs[map[key]] = ev.target.value;
        savePrefs();
        renderPreview();
      });
    });
    $("pref-width").addEventListener("input", function (ev) {
      state.prefs.contentWidthMm = Number(ev.target.value);
      savePrefs();
      applyPrintWidth();
    });
    $("pref-terbilang").addEventListener("change", function (ev) {
      state.prefs.showTerbilang = ev.target.checked;
      savePrefs();
      renderPreview();
    });
    $("pref-header").addEventListener("change", function (ev) {
      state.prefs.showHeader = ev.target.checked;
      savePrefs();
      renderPreview();
    });
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      els.toast.classList.remove("show");
    }, 2400);
  }

  function currentPayload() {
    return {
      type: state.type,
      fields: JSON.parse(JSON.stringify(state.fields)),
      items: JSON.parse(JSON.stringify(state.items))
    };
  }

  function saveDraft() {
    const drafts = loadDrafts();
    const titleParts = [DOC_TYPES.find(function (d) { return d.id === state.type; }).label, state.fields.nomor];
    drafts.unshift({
      id: "draft-" + Date.now(),
      title: titleParts.join(" · "),
      savedAt: new Date().toISOString(),
      payload: currentPayload()
    });
    saveDrafts(drafts.slice(0, 30));
    renderDrafts();
    toast("Draft disimpan di perangkat ini.");
  }

  function renderDrafts() {
    const drafts = loadDrafts();
    if (!drafts.length) {
      els.draftList.innerHTML = '<div class="settings-note">Belum ada draft. Data transaksi tidak disimpan otomatis.</div>';
      return;
    }
    els.draftList.innerHTML = drafts
      .map(function (draft) {
        const when = new Date(draft.savedAt);
        const stamp =
          String(when.getDate()).padStart(2, "0") +
          "/" +
          String(when.getMonth() + 1).padStart(2, "0") +
          "/" +
          when.getFullYear() +
          " " +
          String(when.getHours()).padStart(2, "0") +
          ":" +
          String(when.getMinutes()).padStart(2, "0");
        return (
          '<div class="draft-item"><div><strong>' +
          escapeHtml(draft.title) +
          "</strong><br>" +
          escapeHtml(stamp) +
          '</div><div><button class="btn btn-ghost btn-small" data-load-draft="' +
          escapeHtml(draft.id) +
          '">Muat</button> <button class="btn btn-ghost btn-small" data-del-draft="' +
          escapeHtml(draft.id) +
          '">Hapus</button></div></div>'
        );
      })
      .join("");
    els.draftList.querySelectorAll("[data-load-draft]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        loadDraft(btn.getAttribute("data-load-draft"));
      });
    });
    els.draftList.querySelectorAll("[data-del-draft]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const next = loadDrafts().filter(function (d) {
          return d.id !== btn.getAttribute("data-del-draft");
        });
        saveDrafts(next);
        renderDrafts();
      });
    });
  }

  function loadDraft(id) {
    const draft = loadDrafts().find(function (d) {
      return d.id === id;
    });
    if (!draft) return;
    state.type = draft.payload.type;
    state.fields = Object.assign(emptyFields(draft.payload.type), draft.payload.fields);
    state.items = draft.payload.items && draft.payload.items.length ? draft.payload.items : [emptyItem()];
    state.errors = {};
    renderTabs();
    renderForm();
    renderPreview();
    toast("Draft dimuat. Form tidak dikosongkan setelah cetak.");
  }

  function clearForm() {
    state.fields = emptyFields(state.type);
    state.items = [emptyItem()];
    state.errors = {};
    renderForm();
    renderPreview();
    toast("Form dibersihkan. Draft tersimpan tidak ikut terhapus.");
  }

  function printDoc() {
    state.errors = {};
    if (!validate()) {
      renderForm();
      toast("Lengkapi field wajib sebelum mencetak.");
      return;
    }
    renderForm();
    renderPreview();
    applyPrintWidth();
    window.alert(
      "Petunjuk cetak thermal 58 mm:\n\n" +
        "1. Pilih printer thermal yang sudah terpasang sebagai printer sistem.\n" +
        "2. Set ukuran kertas ke 58 mm / 58mm x receipt / roll paper.\n" +
        "3. Matikan header dan footer browser.\n" +
        "4. Skala: 100%. Margin: None / Minimum.\n" +
        "5. Konten efektif saat ini: " +
        state.prefs.contentWidthMm +
        " mm.\n\n" +
        "Browser tidak dapat memilih printer Bluetooth Classic secara langsung. Printer harus sudah dipasang di Android, Windows, atau macOS."
    );
    window.print();
  }

  function registerWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js").catch(function () {
      /* offline-first tetap berjalan dari cache sebelumnya jika ada */
    });
  }

  function init() {
    els.tabs = $("doc-tabs");
    els.formFields = $("form-fields");
    els.printRoot = $("print-root");
    els.draftList = $("draft-list");
    els.toast = $("toast");
    els.widthValue = $("width-value");

    renderTabs();
    renderPrefs();
    bindPrefs();
    renderForm();
    renderPreview();
    renderDrafts();
    applyPrintWidth();

    $("btn-print").addEventListener("click", printDoc);
    $("btn-draft").addEventListener("click", saveDraft);
    $("btn-clear").addEventListener("click", clearForm);
    $("btn-settings").addEventListener("click", function () {
      $("settings-panel").classList.toggle("hidden");
    });
    $("btn-help").addEventListener("click", function () {
      $("help-panel").classList.toggle("hidden");
    });

    registerWorker();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
