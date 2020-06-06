import { setRecords, getRecords, getXRPinUSD, notify } from "./utils";
import browser from "webextension-polyfill";
import manifest from "./manifest.json";

let XRPPriceInUSD;

async function setCurrencyConversion() {
  try {
    XRPPriceInUSD = await getXRPinUSD();
    console.log("Current XRP price in USD", XRPPriceInUSD);
    await setRecords("paytrackr_xrp_in_usd", XRPPriceInUSD);
  } catch (e) {
    console.log("Error from background.js", e);
  }
}

setCurrencyConversion();

// Get conversion every minute
setInterval(() => {
  setCurrencyConversion();
}, 60000);

browser.runtime.onMessage.addListener((msg) => {
  if (msg === "paytrackr_monetizationstart") {
    browser.browserAction.setBadgeText({ text: "$" });
  } else if (msg === "paytrackr_monetizationstop") {
    browser.browserAction.setBadgeText({ text: "" });
  } else if (msg.includes(`You've paid a total`)) {
    notify("PayTrackr", msg);
  }
});

// Temporary version checker
// const checkVersion = async () => {
//   const version = await getRecords("paytrackr_version", "");

//   if (!version || version !== manifest.version) {
//     setRecords("paytrackr_history", []);
//     setRecords("paytrackr_hostnames", []);
//     setRecords("paytrackr_alerts", []);
//     setRecords("paytrackr_version", manifest.version);
//   }
// };

// checkVersion();
