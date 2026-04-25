const browserManager = require("./browserManager");

async function getEscola() {
    const browser = browserManager.getBrowser();
    if (!browser) return;
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
        if (["image", "stylesheet", "font"].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    await page.goto("https://seges.sedu.es.gov.br/context/schools", {
        waitUntil: "networkidle0",
    });
    await page.waitForSelector("table#schools tbody tr");

    const escolas = await page.evaluate(() =>
        Array.from(document.querySelectorAll("table#schools tbody tr"))
            .map((row) => {
                const col = row.querySelectorAll("td");
                if (col.length < 2) return null;
                const url = col[1].querySelector("a").href;
                return {
                    id: url.split("=")[1],
                    nome: col[0].textContent.trim(),
                    url,
                };
            })
            .filter(Boolean),
    );

    await page.close();

    return escolas;
}
async function getAnos(id) {
    const browser = browserManager.getBrowser();
    if (!browser) return [];

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
        if (["image", "stylesheet", "font"].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    try {
        await page.goto("https://seges.sedu.es.gov.br/context/schools", {
            waitUntil: "networkidle0",
        });

        const schoolSelector = `a[href*="school_id=${id}"]`;
        await page.waitForSelector(schoolSelector);

        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle0" }),
            page.click(schoolSelector),
        ]);

        await page.goto("https://seges.sedu.es.gov.br/context/school_years", {
            waitUntil: "networkidle0",
        });

        await page.waitForSelector("table#school_years tbody tr", {
            timeout: 8000,
        });

        const anos = await page.evaluate(() => {
            return Array.from(
                document.querySelectorAll("table#school_years tbody tr"),
            )
                .map((row) => {
                    const col = row.querySelectorAll("td");
                    if (col.length < 2) return null;

                    const link = col[1].querySelector("a");
                    if (!link) return null;

                    const url = link.href;
                    const idMatch = url.match(/school_year_id=(\d+)/);

                    return {
                        id: idMatch ? idMatch[1] : url.split("=")[1],
                        ano: col[0].textContent.trim(),
                        url: url,
                    };
                })
                .filter(Boolean);
        });

        return anos;
    } catch (error) {
        console.error(error);
        return [];
    } finally {
        await page.close();
    }
}

async function postEscola(id) {
    const browser = browserManager.getBrowser();
    if (!browser) return [];

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
        if (["image", "stylesheet", "font"].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    try {
        await page.goto("https://seges.sedu.es.gov.br/context/school_years", {
            waitUntil: "networkidle0",
        });

        const schoolSelector = `a[href*="school_year_id=${id}"]`;
        await page.waitForSelector(schoolSelector);

        await Promise.all([
            page.waitForNavigation({ waitUntil: "networkidle0" }),
            page.click(schoolSelector),
        ]);
        return true;
    } catch (error) {
        console.error(error);
        return [];
    } finally {
        await page.close();
    }
}

module.exports = { getEscola, getAnos, postEscola };
