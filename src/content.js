import {
  getRecords,
  setRecords,
  getRandomColor,
  makeid,
  extractHostname,
  getTotalForEachAssetCode,
} from "./utils";
import BigNumber from "bignumber.js";
BigNumber.config({ DECIMAL_PLACES: 9 });
import browser from "webextension-polyfill";
import dayjs from "dayjs";

// Inject to all tabs so we can track
// monetization progress
const script = document.createElement("script");
// TODO: add "inject.js" to web_accessible_resources in manifest.json
script.src = chrome.runtime.getURL("inject.js");
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

const inIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

let counter;
let iframeInitialized = false;
const initIframe = () => {
  if (inIframe() || iframeInitialized) {
    // Dont attach iframe if
    // 1. Content is running in iframe already
    // 2. iframe is already initialized
    return;
  }

  let isIframeAttached = false;
  iframeInitialized = true;

  const attachIframe = () => {
    const iframe = document.createElement("iframe");
    iframe.id = "paytrackr_iframe";
    iframe.src = "https://paytrackr-developer.now.sh";
    iframe.style = "width:0;height:0;border:0; border:none;";
    iframe.allow = "monetization";
    document.body.appendChild(iframe);
    isIframeAttached = true;
  };

  const detachIframe = () => {
    const iframe = document.getElementById("paytrackr_iframe");
    if (iframe) {
      iframe.parentNode.removeChild(iframe);
      isIframeAttached = false;
    }
  };

  let darkColor = "#1E1E1E";
  let lightColor = "#FFF";

  const attachCounter = () => {
    counter = document.createElement("div");

    counter.style = `
      position: fixed;
      padding: 10px;
      bottom: 40px;
      left: 40px;
      background-color: ${darkColor};
      color: ${lightColor};
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: Arial, Helvetica, sans-serif;
      font-size: small;
    `;
    counter.innerText = "USD 0";
    document.body.appendChild(counter);
  };

  // Attach counter
  attachCounter();

  getRecords("paytrackr_support_developer", false).then((res) => {
    if (res && !isIframeAttached) {
      attachIframe();
    }
  });

  Promise.all([
    getRecords("paytrackr_support_developer", false),
    getRecords("paytrackr_options", {
      showCounter: true,
      format: "USD",
      theme: "dark",
    }),
  ]).then((res) => {
    if (res[0] && !isIframeAttached) {
      attachIframe();
    }

    if (res[1].theme === "dark") {
      counter.style.background = darkColor;
      counter.style.color = lightColor;
    } else {
      counter.style.background = lightColor;
      counter.style.color = darkColor;
    }
  });

  browser.runtime.onMessage.addListener((msg) => {
    if (typeof msg === "object") {
      if (msg.agreeSupport && !isIframeAttached) {
        attachIframe();
      } else if (msg.theme && counter) {
        if (msg.theme === "dark") {
          counter.style.background = darkColor;
          counter.style.color = lightColor;
        } else {
          counter.style.background = lightColor;
          counter.style.color = darkColor;
        }
      } else {
        detachIframe();
      }
    }
  });
};

// Listen to monetization progress event
// sent by our injected file
document.addEventListener("paytrackr_monetizationprogress", async (e) => {
  const [history, hostnames, alerts, XRPPriceInUSD] = await Promise.all([
    getRecords("paytrackr_history"),
    getRecords("paytrackr_hostnames"),
    getRecords("paytrackr_alerts"),
    getRecords("paytrackr_xrp_in_usd"),
  ]);

  const { amount, assetScale, assetCode, paymentPointer } = e.detail;
  const scale = Math.pow(10, assetScale);
  const newScaledAmount = (new BigNumber(amount, 10).div(scale).toNumber())
    .toFixed(assetScale);

  const now = dayjs().format("YYYY-MM-DD");

  const historyIdx = history.findIndex((item) => {
    return now === dayjs(item.date).format("YYYY-MM-DD") &&
      item.paymentPointer === paymentPointer && item.url === e.target.URL;
  });

  if (historyIdx !== -1) {
    history[historyIdx].scaledAmount = new BigNumber(
      history[historyIdx].scaledAmount,
      10,
    )
      .plus(newScaledAmount)
      .toNumber();
    history[historyIdx].date = Date.now();
  } else {
    history.unshift({
      id: makeid(5),
      paymentPointer,
      url: e.target.URL,
      date: Date.now(),
      scaledAmount: newScaledAmount,
      assetCode,
      assetScale,
    });
  }

  setRecords("paytrackr_history", history);

  const hostname = extractHostname(e.target.URL);
  const hostnameIndex = hostnames.findIndex((i) => i.hostname === hostname);

  if (hostnameIndex !== -1) {
    const assetCodeIndex = hostnames[hostnameIndex].currencies.findIndex((i) =>
      i.assetCode === assetCode
    );
    if (assetCodeIndex !== -1) {
      const currentTotal =
        hostnames[hostnameIndex].currencies[assetCodeIndex].total;
      const totalAmount = new BigNumber(currentTotal, 10)
        .plus(newScaledAmount)
        .toNumber();
      hostnames[hostnameIndex].currencies[assetCodeIndex].total = totalAmount;
    } else {
      hostnames[hostnameIndex].currencies.push({
        assetCode,
        assetScale,
        total: newScaledAmount,
      });
    }
    hostnames[hostnameIndex].lastUpdate = Date.now();
  } else {
    hostnames.push({
      hostname,
      lastUpdate: Date.now(),
      color: getRandomColor(),
      currencies: [{
        assetCode,
        assetScale,
        total: newScaledAmount,
      }],
    });
  }

  setRecords("paytrackr_hostnames", hostnames);

  const currentTotal = getTotalForEachAssetCode(hostnames, false, XRPPriceInUSD)
    .reduce((a, b) => a + +b.total, 0);

  if (counter) {
    counter.innerText = `USD ${currentTotal.toFixed(9)}`;
  }

  const activeAlerts = alerts.filter((i) => !i.done);

  activeAlerts.forEach((alert) => {
    if (currentTotal >= alert.amount) {
      const alertIdx = alerts.findIndex((i) => i.date === alert.date);
      alerts[alertIdx].done = true;
      browser.runtime.sendMessage(`You've paid a total of $${alert.amount}!`);
    }
  });
  setRecords("paytrackr_alerts", alerts);
});

document.addEventListener("paytrackr_monetizationstart", (e) => {
  initIframe();
  browser.runtime.sendMessage("paytrackr_monetizationstart");
});

document.addEventListener("paytrackr_monetizationstop", (e) => {
  browser.runtime.sendMessage("paytrackr_monetizationstop");
});
