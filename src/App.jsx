import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "https://backend-all-tgww.onrender.com/api";

const OUTLETS = ["Pune Central", "Pune Airport", "Pune NDA"];
const LOCATIONS = ["Stock Room", "Sky Bar", "Low Bar"];

function Button({ children, variant = "primary", ...props }) {
  return <button className={`btn ${variant}`} {...props}>{children}</button>;
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function SelectBox({ value, onChange, children, disabled }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      {children}
    </select>
  );
}

function StatCard({ title, value, sub, icon, children }) {
  return (
    <Card>
      <div className="stat">
        <div>
          <p className="muted">{title}</p>
          <h2>{value}</h2>
          {sub && <p className="small">{sub}</p>}
          {children}
        </div>
        <div className="statIcon">{icon}</div>
      </div>
    </Card>
  );
}

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Backend not reachable. Check VITE_API_URL.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Server error ${response.status}`);
  return data;
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("1234");

  function submit(e) {
    e.preventDefault();
    localStorage.setItem("inventory_user_demo", JSON.stringify({ username }));
    onLogin();
  }

  return (
    <div className="loginPage">
      <div className="hero">
        <span className="pill">Inventory Platform</span>
        <h1>Outlet-first hospitality inventory system</h1>
        <p>Client-ready demo for outlet, bar, stock room, assign stock, transfer stock, scanner flow and ML calculation.</p>
      </div>

      <Card className="loginCard">
        <h2>Login</h2>
        <p className="muted">Demo login</p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit">Continue</Button>
        </form>
        <div className="note">Use any username/password for demo.</div>
      </Card>
    </div>
  );
}

function InventoryReading({ row, selectedBottle, currentWeight, remainingML, onManualChange, manualValues, onSaveManual }) {
  const active = !!row || !!selectedBottle;
  const name = selectedBottle?.brandName || row?.brandName || "-//-";
  const category = selectedBottle?.category || row?.category || "-";
  const size = selectedBottle?.bottleSizeML || row?.bottleSizeML || "-";

  return (
    <div className={`reading ${!active ? "disabled" : ""}`}>
      <div className="readingTop">
        <div>
          <p className="muted">Brand Name</p>
          <h2>{name}</h2>
          <p className="muted">{active ? `${category} • ${size} ML` : "-"}</p>
        </div>

        <div className="readingRight">
          <div className="currentReading">
            <p className="muted">Current Reading</p>
            <p className="small">REMAINING</p>
            <h2>{selectedBottle ? `${remainingML || 0} ML` : row ? `${row.openBottleML || 0} ML` : "--/--"}</h2>
          </div>
        </div>
      </div>

      <div className="readingGrid">
        <div className="mini">
          <p>TOTAL FULL BOTTLES</p>
          <h2>{row ? row.fullBottles : "-"}</h2>
        </div>
        <div className="mini">
          <p>TOTAL OPEN BOTTLE ML</p>
          <h2>{row ? row.openBottleML : "-"}</h2>
        </div>
        <div className="mini">
          <p>CLOSING FULL BOTTLES</p>
          <input value={manualValues.closingFull} onChange={(e) => onManualChange("closingFull", e.target.value)} placeholder="Type value" />
        </div>
        <div className="mini">
          <p>CLOSING EMPTY BOTTLES</p>
          <input value={manualValues.closingEmpty} onChange={(e) => onManualChange("closingEmpty", e.target.value)} placeholder="Type value" />
        </div>
        <div className="mini wide">
          <p>CLOSING OPEN BOTTLE ML</p>
          <input value={manualValues.closingOpenMl} onChange={(e) => onManualChange("closingOpenMl", e.target.value)} placeholder="Type value or scan bottle" />
        </div>
      </div>

      <div className="rowButtons">
        <Button onClick={onSaveManual}>Save Closing</Button>
        <Button variant="secondary">Read Next Bottle</Button>
        <Button variant="secondary">Update Indent</Button>
      </div>
    </div>
  );
}

function AssignTransferModal({ type, outlet, location, stock, bottles, onClose, onDone }) {
  const [form, setForm] = useState({
    barcode: "",
    toOutlet: outlet || OUTLETS[0],
    toLocation: "Stock Room",
    quantityFull: "0",
    quantityOpen: "0",
    openBottleML: "0",
    note: "",
  });
  const [message, setMessage] = useState("");

  const isTransfer = type === "transfer";

  async function submit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const payload = isTransfer
        ? {
            barcode: form.barcode.trim(),
            fromOutlet: outlet,
            fromLocation: location,
            toOutlet: form.toOutlet,
            toLocation: form.toLocation,
            quantityFull: Number(form.quantityFull || 0),
            quantityOpen: Number(form.quantityOpen || 0),
            openBottleML: Number(form.openBottleML || 0),
            note: form.note,
          }
        : {
            barcode: form.barcode.trim(),
            toOutlet: outlet,
            toLocation: location,
            quantityFull: Number(form.quantityFull || 0),
            quantityOpen: Number(form.quantityOpen || 0),
            openBottleML: Number(form.openBottleML || 0),
            note: form.note,
          };

      await api(isTransfer ? "/stock/transfer" : "/stock/assign", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage(isTransfer ? "Transfer completed successfully." : "Stock assigned successfully.");
      await onDone();
      setTimeout(onClose, 450);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="modalBg">
      <Card className="modalCard">
        <div className="cardHead">
          <div>
            <h2>{isTransfer ? "Transfer Stock" : "Assign Stock"}</h2>
            <p className="muted">{outlet} / {location}</p>
          </div>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>

        {message && <div className="alert">{message}</div>}

        <form onSubmit={submit} className="modalGrid">
          <div className="field">
            <label>Barcode</label>
            <input
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              placeholder="Scan/type barcode"
              list="bottle-barcodes"
              required
            />
            <datalist id="bottle-barcodes">
              {bottles.map((b) => <option key={b._id} value={b.barcode}>{b.brandName}</option>)}
            </datalist>
          </div>

          {isTransfer && (
            <>
              <div className="field">
                <label>To Outlet</label>
                <SelectBox value={form.toOutlet} onChange={(v) => setForm({ ...form, toOutlet: v })}>
                  {OUTLETS.map((o) => <option key={o}>{o}</option>)}
                </SelectBox>
              </div>

              <div className="field">
                <label>To Location</label>
                <SelectBox value={form.toLocation} onChange={(v) => setForm({ ...form, toLocation: v })}>
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </SelectBox>
              </div>
            </>
          )}

          <div className="field">
            <label>Full Bottle Count</label>
            <input type="number" min="0" value={form.quantityFull} onChange={(e) => setForm({ ...form, quantityFull: e.target.value })} />
          </div>

          <div className="field">
            <label>Open Bottle Count</label>
            <input type="number" min="0" value={form.quantityOpen} onChange={(e) => setForm({ ...form, quantityOpen: e.target.value })} />
          </div>

          <div className="field">
            <label>Open Bottle ML</label>
            <input type="number" min="0" value={form.openBottleML} onChange={(e) => setForm({ ...form, openBottleML: e.target.value })} />
          </div>

          <div className="field wideField">
            <label>Note</label>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note" />
          </div>

          <Button type="submit">{isTransfer ? "Transfer Stock" : "Assign Stock"}</Button>
        </form>
      </Card>
    </div>
  );
}

function ScannerPanel({ outlet, location, onReadingSaved }) {
  const scannerRef = useRef(null);
  const timerRef = useRef(null);

  const [scaleStatus, setScaleStatus] = useState("Disconnected");
  const [scannerStatus, setScannerStatus] = useState("Disconnected");
  const [barcode, setBarcode] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [bottle, setBottle] = useState(null);
  const [remainingML, setRemainingML] = useState(0);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);

  async function connectDevices() {
    setError("");
    setScannerStatus("Ready - scan barcode now");
    setListening(true);
    setTimeout(() => scannerRef.current?.focus(), 100);

    try {
      if (!("serial" in navigator)) {
        setScaleStatus("Web Serial not supported");
        alert("Use Chrome or Edge. Web Serial is not supported in this browser.");
        return;
      }

      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });

      setScaleStatus("Connected");
      readWeight(selectedPort);
    } catch (e) {
      console.error(e);
      setScaleStatus("Connection failed");
    }
  }

  async function readWeight(port) {
    try {
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const match = buffer.match(/-?\d+(\.\d+)?/);
        if (match) {
          setCurrentWeight(Math.round(Number(match[0])));
          buffer = "";
        }
      }
    } catch (e) {
      console.error(e);
      setScaleStatus("Reading stopped");
    }
  }

  async function fetchBottle(scannedBarcode) {
    try {
      setError("");
      const data = await api(`/bottles/${scannedBarcode}`);
      setBottle(data);
      setScannerStatus("Barcode matched with database");
    } catch (e) {
      setBottle(null);
      setScannerStatus("Bottle not found");
      setError(`Barcode ${scannedBarcode} not found. Add bottle in Admin Panel first.`);
    } finally {
      setBarcode("");
      setTimeout(() => scannerRef.current?.focus(), 100);
    }
  }

  function handleScannerInput(value) {
    setBarcode(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const clean = value.trim();
      if (clean) fetchBottle(clean);
    }, 150);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const clean = barcode.trim();
      if (clean) fetchBottle(clean);
    }
  }

  function searchManual() {
    const clean = manualBarcode.trim();
    if (!clean) return;
    fetchBottle(clean);
    setManualBarcode("");
  }

  useEffect(() => {
    if (!bottle) {
      setRemainingML(0);
      return;
    }

    const weight = Number(currentWeight);
    const empty = Number(bottle.emptyBottleWeightG || 0);
    const size = Number(bottle.bottleSizeML || 0);

    if (!weight || !empty || weight <= empty) {
      setRemainingML(0);
      return;
    }

    setRemainingML(Math.min(Math.round(weight - empty), size));
  }, [currentWeight, bottle]);

  useEffect(() => {
    const keepFocus = () => {
      if (listening) scannerRef.current?.focus();
    };
    window.addEventListener("click", keepFocus);
    return () => window.removeEventListener("click", keepFocus);
  }, [listening]);

  async function saveReading() {
    if (!bottle) return alert("Scan a valid bottle first.");

    await api("/readings", {
      method: "POST",
      body: JSON.stringify({
        time: new Date().toLocaleString(),
        barcode: bottle.barcode,
        productId: bottle.productId,
        brandName: bottle.brandName,
        category: bottle.category,
        bottleSizeML: bottle.bottleSizeML,
        emptyBottleWeightG: bottle.emptyBottleWeightG,
        currentWeightG: Number(currentWeight || 0),
        remainingML,
        outlet,
        location,
      }),
    });

    setBottle(null);
    setScannerStatus("Ready - scan next barcode");
    onReadingSaved?.();
  }

  return (
    <Card className="innerCard">
      <div className="cardHead">
        <div>
          <h2>Machine Connection</h2>
          <p className="muted">Connect barcode scanner and weight machine. Then scan bottle barcode to fetch database record.</p>
        </div>
      </div>

      <div className="deviceGrid">
        <div className="deviceStatus">
          <p className="muted">Weight Machine</p>
          <h3>{scaleStatus}</h3>
          <Button onClick={connectDevices}>Connect Device</Button>
        </div>
        <div className="deviceStatus">
          <p className="muted">Barcode Scanner</p>
          <h3>{scannerStatus}</h3>
          <p className="small">USB scanner works like keyboard input.</p>
        </div>
      </div>

      <input
        ref={scannerRef}
        className="scannerCapture"
        value={barcode}
        onChange={(e) => handleScannerInput(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />

      <div className="manualGrid scannerManual">
        <input value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)} placeholder="Type barcode manually for demo" />
        <Button onClick={searchManual}>Search Barcode</Button>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="readingGrid scannerReading">
        <div className="mini"><p>BRAND NAME</p><h2>{bottle?.brandName || "-"}</h2></div>
        <div className="mini"><p>BOTTLE SIZE</p><h2>{bottle?.bottleSizeML || "-"} ML</h2></div>
        <div className="mini"><p>CURRENT WEIGHT</p><h2>{currentWeight || "-"} G</h2></div>
        <div className="mini"><p>REMAINING ML</p><h2>{remainingML || 0} ML</h2></div>
      </div>

      <div className="rowButtons">
        <Button onClick={saveReading}>Save Reading</Button>
      </div>
    </Card>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("inventory_user_demo"));

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  return <Dashboard onLogout={() => { localStorage.removeItem("inventory_user_demo"); setLoggedIn(false); }} />;
}

function Dashboard({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [outletPage, setOutletPage] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [bottles, setBottles] = useState([]);
  const [stock, setStock] = useState([]);
  const [readings, setReadings] = useState([]);
  const [movements, setMovements] = useState([]);
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState(null);
  const [manualSearch, setManualSearch] = useState("");
  const [manualBottle, setManualBottle] = useState(null);
  const [manualValues, setManualValues] = useState({ closingFull: "", closingEmpty: "", closingOpenMl: "" });

  const currentUserName = "Inventory Demo";
  const currentOwnerName = "Client Presentation";

  const activeRows = stock.filter((s) => s.outlet === selectedOutlet && s.location === selectedLocation);
  const latestRow = manualBottle
    ? stock.find((s) => s.barcode === manualBottle.barcode && s.outlet === selectedOutlet && s.location === selectedLocation)
    : activeRows[0];

  const productResults = useMemo(() => {
    const q = manualSearch.toLowerCase().trim();
    if (!q) return [];
    return bottles.filter((p) =>
      String(p.brandName || "").toLowerCase().includes(q) ||
      String(p.category || "").toLowerCase().includes(q) ||
      String(p.productId || "").toLowerCase().includes(q) ||
      String(p.barcode || "").toLowerCase().includes(q)
    );
  }, [bottles, manualSearch]);

  async function refreshAll() {
    try {
      const [bottleData, stockData, readingData, movementData] = await Promise.all([
        api("/bottles"),
        api("/stock"),
        api("/readings"),
        api("/stock/movements/history"),
      ]);

      setBottles(Array.isArray(bottleData) ? bottleData : []);
      setStock(Array.isArray(stockData) ? stockData : []);
      setReadings(Array.isArray(readingData) ? readingData : []);
      setMovements(Array.isArray(movementData) ? movementData : []);
    } catch (e) {
      setStatus(e.message);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  function openOutlet(outletName) {
    setOutletPage(outletName);
    setPage("outletDetail");
  }

  function openLocation(outletName, locationName) {
    setSelectedOutlet(outletName);
    setSelectedLocation(locationName);
    setPage("location");
  }

  function exportCsv() {
    const header = ["Product ID", "Brand Name", "Category", "Bottle Size", "Cost", "Total Full Bottle", "Total Open Bottle", "Open Bottle ML", "Stock Value"];
    const body = activeRows.map((r) => [
      r.productId,
      r.brandName,
      r.category,
      r.bottleSizeML,
      r.costPrice,
      r.fullBottles,
      r.openBottles,
      r.openBottleML,
      r.stockValue,
    ]);

    const csv = [header, ...body].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedOutlet}_${selectedLocation}_inventory.csv`;
    link.click();
  }

  async function saveManualClosing() {
    if (!manualBottle && !latestRow) return setStatus("Search/select brand first.");

    try {
      const barcode = manualBottle?.barcode || latestRow?.barcode;
      const stockLine = activeRows.find((s) => s.barcode === barcode);

      await api("/readings", {
        method: "POST",
        body: JSON.stringify({
          time: new Date().toLocaleString(),
          barcode,
          productId: manualBottle?.productId || latestRow?.productId,
          brandName: manualBottle?.brandName || latestRow?.brandName,
          category: manualBottle?.category || latestRow?.category,
          bottleSizeML: manualBottle?.bottleSizeML || latestRow?.bottleSizeML,
          emptyBottleWeightG: manualBottle?.emptyBottleWeightG || latestRow?.emptyBottleWeightG,
          currentWeightG: 0,
          remainingML: Number(manualValues.closingOpenMl || 0),
          outlet: selectedOutlet,
          location: selectedLocation,
          closingFullBottle: Number(manualValues.closingFull || 0),
          closingEmptyBottle: Number(manualValues.closingEmpty || 0),
        }),
      });

      setStatus("Manual closing saved in history.");
      setManualValues({ closingFull: "", closingEmpty: "", closingOpenMl: "" });
      refreshAll();
    } catch (e) {
      setStatus(e.message);
    }
  }

  return (
    <div className="app">
      <header>
        <div>
          <p className="muted">User Interface</p>
          <h1>{currentUserName}</h1>
          <p className="muted">{currentOwnerName}</p>
        </div>

        <nav>
          {["dashboard", "outlet", "report", "history"].map((item) => (
            <Button key={item} variant={page === item ? "primary" : "secondary"} onClick={() => setPage(item)}>
              {item}
            </Button>
          ))}
          <Button variant="secondary" onClick={refreshAll}>Refresh</Button>
          <Button variant="secondary" onClick={onLogout}>Logout</Button>
        </nav>
      </header>

      <main>
        {status ? <div className="alert">{status}</div> : null}

        {page === "dashboard" && (
          <>
            <section className="stats">
              <StatCard title="Restaurant / Bar" value={currentUserName} sub={currentOwnerName} icon="🏢" />
              <StatCard title="Device Status" value="Disconnected" sub="scanner + scale" icon="📡">
                <div className="connectUnderStatus">
                  <Button onClick={() => setPage("location")}>Connect Device</Button>
                </div>
              </StatCard>
              <StatCard title="Database Records" value={bottles.length} sub="bottles added from admin" icon="🍾" />
            </section>

            <Card>
              <div className="cardHead inventoryHead">
                <div>
                  <h2>Inventory</h2>
                  <p className="muted">Select outlet and stock room/bar to take inventory, assign stock, transfer stock, or scan bottle.</p>
                </div>

                <div className="compactFilters">
                  <SelectBox value={selectedOutlet} onChange={(value) => { setSelectedOutlet(value); setSelectedLocation(""); }}>
                    <option value="">Select outlet</option>
                    {OUTLETS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </SelectBox>

                  <SelectBox value={selectedLocation} onChange={setSelectedLocation} disabled={!selectedOutlet}>
                    <option value="">Select bar or stock room</option>
                    {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </SelectBox>
                </div>
              </div>

              <InventoryReading
                row={latestRow}
                selectedBottle={manualBottle}
                currentWeight=""
                remainingML={manualValues.closingOpenMl}
                manualValues={manualValues}
                onManualChange={(key, value) => setManualValues((p) => ({ ...p, [key]: value }))}
                onSaveManual={saveManualClosing}
              />

              {selectedOutlet && selectedLocation ? (
                <>
                  <Card className="innerCard">
                    <div className="manualGrid">
                      <div>
                        <input
                          placeholder="Search brand name manually"
                          value={manualSearch}
                          onChange={(e) => setManualSearch(e.target.value)}
                        />
                        {productResults.length > 0 && (
                          <div className="suggestions">
                            {productResults.slice(0, 5).map((p) => (
                              <button
                                key={p._id}
                                onClick={() => {
                                  setManualBottle(p);
                                  setManualSearch(p.brandName);
                                }}
                              >
                                <b>{p.brandName}</b>
                                <span>{p.category} • {p.bottleSizeML} ML • {p.barcode}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <input
                        placeholder="Closing full bottles"
                        value={manualValues.closingFull}
                        onChange={(e) => setManualValues((p) => ({ ...p, closingFull: e.target.value }))}
                      />
                      <input
                        placeholder="Closing empty bottles"
                        value={manualValues.closingEmpty}
                        onChange={(e) => setManualValues((p) => ({ ...p, closingEmpty: e.target.value }))}
                      />
                      <input
                        placeholder="Closing open bottle ML"
                        value={manualValues.closingOpenMl}
                        onChange={(e) => setManualValues((p) => ({ ...p, closingOpenMl: e.target.value }))}
                      />
                      <Button onClick={saveManualClosing}>Save Manual Inventory</Button>
                    </div>
                  </Card>

                  <ScannerPanel outlet={selectedOutlet} location={selectedLocation} onReadingSaved={refreshAll} />
                </>
              ) : (
                <div className="note">Select outlet and stock room/bar to open assign, transfer and scanner flow.</div>
              )}
            </Card>
          </>
        )}

        {page === "outlet" && (
          <div>
            <h2>Outlets</h2>
            <p className="muted">Click an outlet card to view stock room and bars.</p>

            <div className="outletGrid">
              {OUTLETS.map((outlet) => (
                <Card key={outlet}>
                  <button className="outletCardButton" onClick={() => openOutlet(outlet)}>
                    <h3>{outlet}</h3>
                    <p className="muted">Stock Room • Sky Bar • Low Bar</p>
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {page === "outletDetail" && (
          <Card>
            <div className="cardHead">
              <div>
                <h2>{outletPage}</h2>
                <p className="muted">Select Stock Room / Bar to view stock.</p>
              </div>
              <Button variant="secondary" onClick={() => setPage("outlet")}>Back</Button>
            </div>

            <div className="outletGrid">
              {LOCATIONS.map((location) => (
                <Card key={location}>
                  <button className="outletCardButton" onClick={() => openLocation(outletPage, location)}>
                    <h3>{location}</h3>
                    <p className="muted">View stock in {location}</p>
                  </button>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {page === "location" && (
          <Card>
            <div className="cardHead">
              <div>
                <h2>Stock in the {selectedLocation || "Bar"}</h2>
                <p className="muted">{selectedOutlet ? `${selectedOutlet} / ${selectedLocation}` : "Select from dropdown or outlet page"}</p>
              </div>

              <div className="rowButtons">
                <Button disabled={!selectedOutlet || !selectedLocation} onClick={() => setModal("assign")}>Assign</Button>
                <Button disabled={!selectedOutlet || !selectedLocation} onClick={() => setModal("transfer")}>Transfer</Button>
                <Button variant="secondary" disabled={!selectedOutlet || !selectedLocation} onClick={exportCsv}>Export</Button>
              </div>
            </div>

            {!selectedOutlet || !selectedLocation ? (
              <div className="filters">
                <SelectBox value={selectedOutlet} onChange={(value) => { setSelectedOutlet(value); setSelectedLocation(""); }}>
                  <option value="">Select outlet</option>
                  {OUTLETS.map((o) => <option key={o}>{o}</option>)}
                </SelectBox>
                <SelectBox value={selectedLocation} onChange={setSelectedLocation} disabled={!selectedOutlet}>
                  <option value="">Select bar or stock room</option>
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </SelectBox>
              </div>
            ) : null}

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Brand Name</th>
                    <th>Category</th>
                    <th>Bottle Size</th>
                    <th>Cost</th>
                    <th>Total Full Bottle</th>
                    <th>Total Open Bottle</th>
                    <th>Open Bottle ML</th>
                    <th>Stock Value</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty">No stock found. Add bottle from Admin, then use Assign.</td>
                    </tr>
                  ) : (
                    activeRows.map((r) => (
                      <tr key={r._id}>
                        <td>{r.productId}</td>
                        <td>{r.brandName}</td>
                        <td>{r.category}</td>
                        <td>{r.bottleSizeML} ML</td>
                        <td>₹{Number(r.costPrice || 0).toLocaleString("en-IN")}</td>
                        <td>{r.fullBottles}</td>
                        <td>{r.openBottles}</td>
                        <td>{r.openBottleML}</td>
                        <td>₹{Number(r.stockValue || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedOutlet && selectedLocation && (
              <ScannerPanel outlet={selectedOutlet} location={selectedLocation} onReadingSaved={refreshAll} />
            )}
          </Card>
        )}

        {page === "report" && (
          <Card>
            <h2>Report</h2>
            <p className="muted">Export stock data for selected outlet and bar/stock room.</p>

            <div className="filters">
              <SelectBox value={selectedOutlet} onChange={setSelectedOutlet}>
                <option value="">Select outlet</option>
                {OUTLETS.map((o) => <option key={o}>{o}</option>)}
              </SelectBox>
              <SelectBox value={selectedLocation} onChange={setSelectedLocation}>
                <option value="">Select bar or stock room</option>
                {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
              </SelectBox>
              <Button onClick={exportCsv}>Export Inventory</Button>
            </div>
          </Card>
        )}

        {page === "history" && (
          <Card>
            <div className="cardHead">
              <div>
                <h2>History</h2>
                <p className="muted">Scanned items and assign/transfer history.</p>
              </div>
              <Button onClick={refreshAll}>Load History</Button>
            </div>

            <h3>Scanned Items</h3>
            <div className="history">
              {readings.length === 0 && <div className="historyItem"><b>No scanned items yet.</b></div>}
              {readings.map((h) => (
                <div className="historyItem" key={h._id}>
                  <b>{h.brandName || h.barcode}</b>
                  <span>{h.outlet} / {h.location} • Remaining: {h.remainingML} ML • Weight: {h.currentWeightG} G</span>
                  <small>{h.time || new Date(h.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>

            <h3>Assign / Transfer History</h3>
            <div className="history">
              {movements.length === 0 && <div className="historyItem"><b>No stock movement yet.</b></div>}
              {movements.map((h) => (
                <div className="historyItem" key={h._id}>
                  <b>{h.type} • {h.brandName || h.barcode}</b>
                  <span>{h.fromLocation ? `${h.fromOutlet} / ${h.fromLocation} → ` : ""}{h.toOutlet} / {h.toLocation}</span>
                  <small>Full: {h.quantityFull} • Open: {h.quantityOpen} • ML: {h.openBottleML} • {new Date(h.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </Card>
        )}

        {modal && (
          <AssignTransferModal
            type={modal}
            outlet={selectedOutlet}
            location={selectedLocation}
            stock={activeRows}
            bottles={bottles}
            onClose={() => setModal(null)}
            onDone={refreshAll}
          />
        )}
      </main>
    </div>
  );
}
