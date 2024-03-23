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

  // Klicke auf den Button, um einen neuen Tab zu öffnen
  const [newPage] = await Promise.all([
    new Promise(resolve => browser.once('targetcreated', target => resolve(target.page()))),
    page.click('.form-btn-blue')
  ]);
  
  console.log("Clicked on the lpis button.");

  // Warte darauf, dass die URL des neuen Tabs aktualisiert wird
  await newPage.waitForFunction(() => window.location.href.includes('lpis.wu.ac.at'));
  console.log("Current tab URL:", newPage.url()); // URL des aktuellen Tabs
  
  const inputSelector = 'input[type="text"][accesskey="u"]';
  await newPage.waitForSelector(inputSelector);
  await newPage.focus(inputSelector); // Fokussiere das Eingabefeld
  await newPage.keyboard.type('12207319'); // Gib den gewünschten Text ein

  // Eingabe im Passwortfeld
  const passwordInputSelector = 'input[type="password"][accesskey="p"]';
  await newPage.waitForSelector(passwordInputSelector);
  await newPage.type(passwordInputSelector, 'kbjP3yL/yd');

  // Klicken auf den Login-Button
  const loginButtonSelector = 'input[type="submit"][accesskey="l"]';
  await newPage.click(loginButtonSelector);


})();
