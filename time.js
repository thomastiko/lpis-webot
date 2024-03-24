const puppeteer = require("puppeteer");

async function isQuarterToSeven() {
  const now = new Date();
  return now.getHours() === 18 && now.getMinutes() === 49;
}

async function checkTimeAndLog() {
  while (true) {
    if (await isQuarterToSeven()) {
      console.log("It's 18:45 now!");
      break;
    } else {
      console.log("Current time is not 18:45. Waiting...");
      await new Promise(resolve => setTimeout(resolve, 500)); // Warte 1 Minute
    }
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto("https://example.com"); // Hier die URL der Seite angeben, auf der gewartet werden soll
  
  await checkTimeAndLog();

  await browser.close();
})();