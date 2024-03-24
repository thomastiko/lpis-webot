const puppeteer = require("puppeteer");

async function isCustomTime(hour, minute) {
  const now = new Date();
  return now.getHours() === hour && now.getMinutes() === minute;
}

async function checkTimeAndLog(hour, minute) {
  while (true) {
    if (await isCustomTime(hour, minute)) {
      console.log(`It's ${hour}:${minute < 10 ? '0' + minute : minute} now!`);
      break;
    } else {
      console.log(`Current time is not ${hour}:${minute < 10 ? '0' + minute : minute}. Waiting...`);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  await page.goto("https://lpis.wu.ac.at", {
    waitUntil: "load",
  });

  console.log("Navigated to the LPIS website.");

  const [newPage] = await Promise.all([
    new Promise((resolve) =>
      browser.once("targetcreated", (target) => resolve(target.page()))
    ),
    page.click(".form-btn-blue"),
  ]);

  console.log("Clicked on the lpis button.");

  await newPage.waitForFunction(() =>
    window.location.href.includes("lpis.wu.ac.at")
  );
  console.log("Current tab URL:", newPage.url()); 

  const inputSelector = 'input[type="text"][accesskey="u"]';
  await newPage.waitForSelector(inputSelector);
  await newPage.focus(inputSelector); 
  await newPage.keyboard.type("12207319"); // Gib deine Matrikelnummer hier ein

  // Eingabe im Passwortfeld
  const passwordInputSelector = 'input[type="password"][accesskey="p"]';
  await newPage.waitForSelector(passwordInputSelector);
  await newPage.type(passwordInputSelector, "kbjP3yL/yd"); // Gib dein Passwort hier ein

  // Klicken auf den Login-Button
  const loginButtonSelector = 'input[type="submit"][accesskey="l"]';
  await newPage.click(loginButtonSelector);

  await new Promise((resolve) => setTimeout(resolve, 3000)); 
  console.log("Waited for 3 seconds.");

  await newPage.evaluate(() => {
    const tdElements = document.querySelectorAll("td");
    for (const td of tdElements) {
      const spanElements = td.querySelectorAll("span");
      for (const span of spanElements) {
        if (span.innerText.trim() === "Personal, Führung, Organisation") /*Trage den Namen der LV hier ein! */ {
          const lvAnmeldenLink = td.querySelector(
            'a[title="Lehrveranstaltungsanmeldung"]'
          );
          if (lvAnmeldenLink) {
            lvAnmeldenLink.click();
          }
        }
      }
    }
    return null;
  });

  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("Waited for 5 seconds.");

  const parentElement = await newPage.evaluate(() => {
    const trElements = document.querySelectorAll("tr");
    for (const tr of trElements) {
      const aElement = tr.querySelector("td.ver_id a");
      if (aElement && aElement.innerText.trim() === "4750") /* Trage die LV Nummer hier ein */ {
        return tr.outerHTML;
      }
    }
    return null;

  });

  await checkTimeAndLog(19 /*hours */, 8/*minutes */); // Trage hier die Uhrzeit ein

  if (parentElement) {
    let attempts = 0;
    let isDisabled = true;
    while (isDisabled && attempts < 10) {
      const tempPage = await browser.newPage();
      await tempPage.setContent(parentElement);
      const submitButton = await tempPage.$(
        'input[type="submit"][name="cmd"][value="anmelden"]'
      );
      if (submitButton) {
        isDisabled = await tempPage.evaluate(
          (button) => button.disabled,
          submitButton
        );
        if (isDisabled) {
          console.log("Submit button is still disabled. Refreshing page...");
          await tempPage.reload({ waitUntil: "networkidle0" });
          attempts++;
        } else {
          await submitButton.click();
          console.log("Clicked on the submit button.");
        }
      } else {
        console.log("Submit button not found.");
      }
      await tempPage.close();
    }
    if (attempts >= 10) {
      console.log("Max number of attempts reached. Submit button still disabled.");
    }
  } else {
    console.log("Parent element not found.");
  }

/* wenn alles eingestellt ist führe im Terminale node ./index.js aus */

})();
