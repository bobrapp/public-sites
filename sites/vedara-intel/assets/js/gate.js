/* Vedara Intel — passphrase gate.
   The briefing content ships only as ciphertext (assets/js/data.enc.js).
   This module derives an AES-256-GCM key from the passphrase with
   PBKDF2-SHA256 via WebCrypto, decrypts the payload in the browser, parses it
   into the global DATA object, then calls the unchanged render path
   window.VEDARA_BOOT(). Nothing is sent anywhere — there is no backend.

   The derived raw key (not the passphrase) is cached in session storage so a
   refresh in the same tab skips the prompt. Embedded/sandboxed contexts that
   block storage degrade to in-memory only, i.e. re-prompt on each load. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);

  const gate = $("#gate");
  const form = $("#gate-form");
  const input = $("#gate-pass");
  const btn = $("#gate-btn");
  const err = $("#gate-err");
  const status = $("#gate-status");
  const topbar = $("#topbar");
  const main = $("#main");
  const lockbtn = $("#lockbtn");
  const STATUS_IDLE = status.textContent;

  /* ── session key cache: session storage → in-memory ──────────────────
     Same fallback shape as the checklist store in app.js. Key material is
     deliberately never written to a cookie — worst case we re-prompt. */
  const SKEY = "vedara-intel.k.v1";
  const keyStore = (function () {
    let ss = null;
    try {
      const w = window["session" + "Storage"];
      w.setItem(SKEY + ".probe", "1");
      w.removeItem(SKEY + ".probe");
      ss = w;
    } catch (e) {
      ss = null;
    }
    let mem = null;
    return {
      get: function () {
        if (ss) {
          try {
            return ss.getItem(SKEY);
          } catch (e) {
            /* blocked mid-session — fall through */
          }
        }
        return mem;
      },
      set: function (v) {
        mem = v;
        if (ss) {
          try {
            ss.setItem(SKEY, v);
          } catch (e) {
            /* quota or blocked — in-memory only for this load */
          }
        }
      },
      clear: function () {
        mem = null;
        if (ss) {
          try {
            ss.removeItem(SKEY);
          } catch (e) {}
        }
      }
    };
  })();

  /* ── base64 helpers ─────────────────────────────────── */
  const b64ToBytes = (b64) => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };
  const bytesToB64 = (bytes) => {
    let bin = "";
    const a = new Uint8Array(bytes);
    for (let i = 0; i < a.length; i++) bin += String.fromCharCode(a[i]);
    return btoa(bin);
  };

  const subtle = window.crypto && window.crypto.subtle;
  const ENC = window.ENC_DATA;

  async function deriveRawKey(pass, saltBytes, iterations) {
    const base = await subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
    const bits = await subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes, iterations: iterations, hash: "SHA-256" },
      base,
      256
    );
    return new Uint8Array(bits);
  }

  async function decryptWithRawKey(rawKey) {
    const key = await subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["decrypt"]);
    const plain = await subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(ENC.iv), tagLength: 128 },
      key,
      b64ToBytes(ENC.ct)
    );
    return JSON.parse(new TextDecoder().decode(plain));
  }

  function showError(msg) {
    err.textContent = msg;
    err.hidden = false;
    gate.classList.add("err");
    input.setAttribute("aria-invalid", "true");
    status.textContent = STATUS_IDLE;
    btn.disabled = false;
    btn.textContent = "Unlock";
    input.value = "";
    input.focus();
  }

  function clearError() {
    err.hidden = true;
    err.textContent = "";
    gate.classList.remove("err");
    input.setAttribute("aria-invalid", "false");
  }

  function unlock(data) {
    window.DATA = data;
    gate.remove();
    topbar.hidden = false;
    main.hidden = false;
    document.documentElement.classList.add("unlocked");
    window.VEDARA_BOOT();
  }

  function relock() {
    keyStore.clear();
    location.reload();
  }

  if (lockbtn) lockbtn.addEventListener("click", relock);

  /* ── no WebCrypto (insecure context) ─────────────────── */
  if (!subtle || !ENC) {
    btn.disabled = true;
    input.disabled = true;
    showError(
      !ENC
        ? "Encrypted payload missing — rebuild data.enc.js."
        : "Decryption unavailable: this page must be served over https:// or localhost."
    );
    btn.disabled = true;
    input.disabled = true;
    return;
  }

  input.focus();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const pass = input.value;
    if (!pass) {
      showError("Enter the passphrase to continue.");
      return;
    }
    clearError();
    btn.disabled = true;
    btn.textContent = "Deriving key…";
    status.textContent = "DERIVING KEY · PBKDF2-SHA256 · " + ENC.iter.toLocaleString("en-US") + " ITERATIONS…";
    /* yield a frame so the pending state paints before the KDF blocks */
    await new Promise((r) => setTimeout(r, 30));
    try {
      const rawKey = await deriveRawKey(pass, b64ToBytes(ENC.salt), ENC.iter);
      const data = await decryptWithRawKey(rawKey);
      keyStore.set(bytesToB64(rawKey));
      unlock(data);
    } catch (e2) {
      showError("Incorrect passphrase — the payload could not be decrypted.");
    }
  });

  input.addEventListener("input", function () {
    if (!err.hidden) clearError();
  });

  /* ── same-tab resume: try the cached derived key ─────── */
  (async function resume() {
    const cached = keyStore.get();
    if (!cached) return;
    try {
      const data = await decryptWithRawKey(b64ToBytes(cached));
      unlock(data);
    } catch (e) {
      keyStore.clear();
    }
  })();
})();
