const puppeteer = require("puppeteer");

async function isCustomTime(hour, minute, second) {
  const now = new Date();
  return (
    now.getHours() === hour &&
    now.getMinutes() === minute &&
    now.getSeconds() === second
  );
}


async function checkTimeAndLog(hour, minute, second) {
  while (true) {
    if (await isCustomTime(hour, minute, second)) {
      console.log(
        `It's ${hour}:${minute < 10 ? "0" + minute : minute}:${
          second < 10 ? "0" + second : second
        } now!`
      );
      break;
    } else {
      console.log(
        `Current time is not ${hour}:${minute < 10 ? "0" + minute : minute}:${
          second < 10 ? "0" + second : second
        }. Waiting...`
      );
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}
/**
 * for speed enhancements this function
 * intercepts all requests to depended, not
 * needed files and prevents the download
 */
async function interceptRequests(page) {
  console.log("intercept requests...");
  page.on("request", (interceptedRequest) => {
    const url = interceptedRequest.url();
    if (
      url.indexOf(".png") !== -1 ||
      url.indexOf(".jpg") !== -1 ||
      url.indexOf(".css") !== -1 ||
      url.indexOf(".ico") !== -1 ||
      url.indexOf(".svg") !== -1 ||
      url.indexOf(".js") !== -1 ||
      url.indexOf(".gif") !== -1
    ) {
      interceptedRequest.respond({
        status: 200,
        body: "",
      });
    } else {
      interceptedRequest.continue();
    }
  });
  await page.setRequestInterception(true);
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
  await new Promise((resolve) => setTimeout(resolve, 3000));
  console.log("Waited for 3 seconds.");

  const popupSelector = ".modal-content";
  const cookiesSelector = ".form-btn.form-btn-secondary";

  const popupElement = await page.$(popupSelector);
  if (popupElement) {
    console.log("Popup found. Clicking on cookies button.");
    await page.waitForSelector(cookiesSelector);
    await page.click(cookiesSelector);
    console.log("Clicked on cookies button.");
  } else {
    console.log("Popup not found. Proceeding with the rest of the script.");
  }

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

  await interceptRequests(newPage);

  await newPage.evaluate(() => {
    const tdElements = document.querySelectorAll("td");
    for (const td of tdElements) {
      const spanElements = td.querySelectorAll("span");
      for (const span of spanElements) {
        if (
          span.innerText.trim() === "Grundlagen wissenschaftlichen Arbeitens"
        ) {
          /*Trage den Namen der LV hier ein! */ const lvAnmeldenLink =
            td.querySelector('a[title="Lehrveranstaltungsanmeldung"]');
          if (lvAnmeldenLink) {
            lvAnmeldenLink.click();
          }
        }
      }
    }
    return null;
  });

  await newPage.waitForSelector("tr");

  const parentElement = await newPage.evaluate(() => {
    const trElements = document.querySelectorAll("tr");
    for (const tr of trElements) {
      const aElement = tr.querySelector("td.ver_id a");
      if (aElement && aElement.innerText.trim() === "0266") {
        /* Trage die LV Nummer hier ein */ return tr.outerHTML;
      }
    }
    return null;
  });

  //await checkTimeAndLog (19 /*hours */, 40/*minutes */, 50 /**seconds */); // Trage hier die Uhrzeit ein

  if (parentElement) {
    const formId = parentElement.match(/id="([^"]+)"/)[1]; // Extrahieren der ID des Formulars
    let isDisabled = true;
    let attempts = 0;
    while (isDisabled && attempts < 10) {
      await newPage.reload( {waitUntil: 'networkidle0'}); // Seite aktualisieren
      await newPage.waitForSelector(`form#${formId}`); // Warten auf das Formular
      const submitButton = await newPage.$(`form#${formId} input[type="submit"]`);
      if (submitButton) {
        isDisabled = await newPage.evaluate(
          (button) => button.getAttribute("disabled") === "disabled",
          submitButton
        );
        if (isDisabled) {
          console.log("Submit button is still disabled. Refreshing page...");
          attempts++;
        } else {
          await submitButton.click(); // Klicke auf den Submit-Button
          console.log("Clicked on the submit button.");
          break; // Beende die Schleife, wenn der Button angeklickt wurde
        }
      } else {
        console.log("Submit button not found on the current page.");
      }
    }
    if (attempts >= 10) {
      console.log("Max number of attempts reached. Submit button still disabled.");
    }
  } else {
    console.log("Eltern-Element nicht gefunden.");
  }

  /*
    let attempts = 0;
    let isDisabled = true;
    while (isDisabled && attempts < 10) {
      //await newPage.setContent(parentElement); // Setze den HTML-Inhalt auf der aktuellen Seite
      const submitButton = await newPage.$('input[type="submit"]'); // Suche den Submit-Button auf der aktuellen Seite
      if (submitButton) {
        isDisabled = await newPage.evaluate((button) => button.disabled, submitButton); // Prüfe, ob der Button deaktiviert ist
        if (isDisabled) {
          console.log("Submit button is still disabled. Refreshing page...");
          
          await newPage.reload(); // Aktualisiere die Seite, falls der Button deaktiviert ist
          await newPage.waitForSelector('input[type="submit"]')
          attempts++;
        } else {
          await submitButton.click(); // Klicke auf den Submit-Button auf der aktuellen Seite
          console.log("Clicked on the submit button.");
        }
      } else {
        console.log("Submit button not found on the current page.");
      }
      // Füge hier ggf. eine Verzögerung ein, falls erforderlich
    }
    if (attempts >= 10) {
      console.log("Max number of attempts reached. Submit button still disabled.");
    }*/

  /* wenn alles eingestellt ist führe im Terminale node ./index.js aus */
})();
