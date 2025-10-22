// src/context/CurrencyContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import API from "../pages/axiosInstance";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("NGN");
  const [symbol, setSymbol] = useState("₦");

  // Load from localStorage when app starts
  
  const fetchCurrency = async () => {
    try {
      const res = await API.get("/settings/public"); // 👈 create this route (explained below)
      const backendCurrency = res.data?.currency;

      if (backendCurrency) {
        setCurrency(backendCurrency);
        setSymbol(getSymbol(backendCurrency));
        localStorage.setItem("currency", backendCurrency);
      }
    } catch (err) {
      console.warn("Could not load currency from backend:", err);
    }
  };

  // ✅ On mount: load from localStorage first, then fetch from backend
  useEffect(() => {
    const saved = localStorage.getItem("currency");
    if (saved) {
      setCurrency(saved);
      setSymbol(getSymbol(saved));
    }
    fetchCurrency();

    // 🔁 Optionally refresh every 30s to stay synced with backend
    const interval = setInterval(fetchCurrency, 30000);
    return () => clearInterval(interval);
  }, []);


  // Update both currency + symbol
  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    setSymbol(getSymbol(newCurrency));
    localStorage.setItem("currency", newCurrency);
  };

  // ✅ Helper to get correct symbol for the top 50 world currencies
const getSymbol = (curr) => {
  const symbols = {
    USD: "$", // US Dollar
    EUR: "€", // Euro
    GBP: "£", // British Pound
    NGN: "₦", // Nigerian Naira
    JPY: "¥", // Japanese Yen
    CNY: "¥", // Chinese Yuan
    INR: "₹", // Indian Rupee
    CAD: "$", // Canadian Dollar
    AUD: "$", // Australian Dollar
    NZD: "$", // New Zealand Dollar
    CHF: "CHF", // Swiss Franc
    SEK: "kr", // Swedish Krona
    NOK: "kr", // Norwegian Krone
    DKK: "kr", // Danish Krone
    ZAR: "R", // South African Rand
    GHS: "₵", // Ghanaian Cedi
    KES: "KSh", // Kenyan Shilling
    UGX: "USh", // Ugandan Shilling
    TZS: "TSh", // Tanzanian Shilling
    EGP: "£", // Egyptian Pound
    MAD: "د.م.", // Moroccan Dirham
    AED: "د.إ", // UAE Dirham
    SAR: "﷼", // Saudi Riyal
    QAR: "﷼", // Qatari Riyal
    BHD: ".د.ب", // Bahraini Dinar
    KWD: "د.ك", // Kuwaiti Dinar
    PKR: "₨", // Pakistani Rupee
    BDT: "৳", // Bangladeshi Taka
    LKR: "Rs", // Sri Lankan Rupee
    MYR: "RM", // Malaysian Ringgit
    SGD: "$", // Singapore Dollar
    IDR: "Rp", // Indonesian Rupiah
    THB: "฿", // Thai Baht
    PHP: "₱", // Philippine Peso
    VND: "₫", // Vietnamese Dong
    KRW: "₩", // South Korean Won
    HKD: "$", // Hong Kong Dollar
    BRL: "R$", // Brazilian Real
    ARS: "$", // Argentine Peso
    CLP: "$", // Chilean Peso
    MXN: "$", // Mexican Peso
    COP: "$", // Colombian Peso
    PEN: "S/", // Peruvian Sol
    RUB: "₽", // Russian Ruble
    TRY: "₺", // Turkish Lira
    PLN: "zł", // Polish Zloty
    CZK: "Kč", // Czech Koruna
    HUF: "Ft", // Hungarian Forint
    ILS: "₪", // Israeli Shekel
    RON: "lei", // Romanian Leu
  };

  return symbols[curr] || curr; // fallback: return code itself if unknown
};

  return (
    <CurrencyContext.Provider value={{ currency, symbol, changeCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
