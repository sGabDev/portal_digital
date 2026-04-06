const puppeteer = require('puppeteer');
const { realizarLogin } = require('./login');
const { startServer, setTurmas } = require('./server');
const browserManager = require('./browserManager');
const path = require('path');
const fs = require('fs');

let sessao = { page: null, browser: null };

const executablePath = [
    path.join(process.cwd(), 'chrome', 'chrome.exe'),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
].find(p => fs.existsSync(p));

async function iniciarRoboComCredenciais(cpf, senha) {
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath,
        args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-zygote', '--disable-gpu']
    });

    browser.on('disconnected', () => process.exit());
    browserManager.setBrowser(browser);
    const page = await browser.newPage();

    try {
        if (await realizarLogin(page, cpf, senha)) {
            sessao = { page, browser };
            rodarColetaDados(page, browser);
            return true;
        }
        await browser.close();
        return false;
    } catch {
        await browser.close();
        return false;
    }
}

async function resetarColeta() {
    if (!sessao.page) return false;
    rodarColetaDados(sessao.page, sessao.browser);
    return true;
}

global.resetarColeta = resetarColeta;
global.iniciarRoboComCredenciais = iniciarRoboComCredenciais;

async function rodarColetaDados(page, browser) {
    try {
        await page.goto('https://seges.sedu.es.gov.br/gradebooks', { waitUntil: 'networkidle0' });

        const turmas = await page.evaluate(() => 
            Array.from(document.querySelectorAll('table.table-striped tbody tr'))
                .map(row => {
                    const col = row.querySelectorAll('td');
                    const nome = col[0]?.innerText.trim() || '';
                    return (nome.includes("AEE") || nome.includes("ECE")) ? null : {
                        nome,
                        ano: col[1]?.innerText.replace(/\s+/g, ' ').trim(),
                        diarios: "PARADO",
                        frequencias: "PARADO",
                        link: col[3]?.querySelector('a.btn-primary')?.href || ''
                    };
                }).filter(t => t && t.link)
        );

        const coletar = async (turma) => {
            for (let i = 0; i < 3; i++) {
                const newPage = await browser.newPage();
                try {
                    await newPage.setRequestInterception(true);
                    newPage.on('request', r => ['image', 'stylesheet', 'font', 'media'].includes(r.resourceType()) ? r.abort() : r.continue());
                    await newPage.goto(turma.link, { waitUntil: 'domcontentloaded', timeout: 15000 });

                    turma.prof = await newPage.evaluate(base => 
                        Array.from(document.querySelectorAll('table.table-striped tbody tr')).reduce((acc, row) => {
                            const col = row.querySelectorAll('td');
                            const id = row.querySelector('a[data-curriculum-discipline-id]')?.getAttribute('data-curriculum-discipline-id');
                            const disc = col[0]?.innerText.trim();
                            if (!disc || disc.includes("AEE") || !id || acc.find(x => x.disciplina === disc)) return acc;
                            acc.push({
                                disciplina: disc,
                                prof: col[1]?.innerText.trim(),
                                id,
                                link: `${base}/print?kind=full&utf8=✓&by_stage=false&competence=#MES&stage_id=#ETAPA&empty_lines=0&curriculum_discipline_id=${id}`,
                                statusDiario: false, statusFrequencia: false
                            });
                            return acc;
                        }, []), turma.link);
                    await newPage.close();
                    return;
                } catch {
                    await newPage.close();
                }
            }
            turma.prof = [];
        };

        const LIMIT = 8;
        for (let i = 0; i < turmas.length; i += LIMIT) {
            await Promise.all(turmas.slice(i, i + LIMIT).map(coletar));
        }

        setTurmas({ statusDiario: false, statusFrequencia: true, turmas });
    } catch (e) {
        console.error(e);
    }
}

(async () => {
    await startServer();
    const cmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    setTimeout(() => require('child_process').exec(`${cmd} http://localhost:3000`), 2000);
})();