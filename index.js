const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Setzen Sie headless auf true, wenn Sie keine grafische Benutzeroberfläche benötigen
    defaultViewport: null,
  });
  const page = await browser.newPage();

  await page.goto("https://lpis.wu.ac.at", {
    waitUntil: "load",
  });

  console.log("Navigated to the LPIS website.");

  await page.click('.form-btn-blue');
  console.log("Clicked on the lpis button.");

  await new Promise(resolve => setTimeout(resolve, 5000));

  const htmlContent = await page.evaluate(() => document.documentElement.outerHTML);
  
  // Ausgabe des HTML-Inhalts
  console.log(htmlContent);

  await browser.close();
})();
