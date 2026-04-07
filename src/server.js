const express = require('express');
const session = require('express-session');
const ExcelJS = require('exceljs');
const path = require('path');
const browserManager = require('./browserManager');
const processarDiario = require('./startDiario');
const processarFrequencia = require('./startFrequencia');

const app = express();
const port = 3000;
const PUBLIC_PATH = path.join(__dirname, '..', 'public');

let ultimaConexao = Date.now();
let dadosTurmas = { statusDiario: false, statusFrequencia: false, turmas: [] };

app.use(express.static(PUBLIC_PATH));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'chave-secreta-segura',
    resave: false,
    saveUninitialized: false
}));

const autenticar = (req, res, next) => req.session.logado ? next() : res.redirect('/');

app.get('/', (req, res) => req.session.logado ? res.redirect('/inicio') : res.sendFile(path.join(PUBLIC_PATH, 'index.html')));

app.post('/login-local', async (req, res) => {
    try {
        if (await global.iniciarRoboComCredenciais(req.body.cpf, req.body.senha)) {
            req.session.logado = true;
            return res.json({ success: true });
        }
        res.status(401).json({ success: false, message: "Falha no SEGES" });
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ success: false });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/inicio', autenticar, (req, res) => res.sendFile(path.join(PUBLIC_PATH, 'inicio/index.html')));
app.get('/diarios', autenticar, (req, res) => res.sendFile(path.join(PUBLIC_PATH, 'diarios/index.html')));
app.get('/frequencia', autenticar, (req, res) => res.sendFile(path.join(PUBLIC_PATH, 'frequencia/index.html')));

app.get('/api/turmas', autenticar, (req, res) => res.json(dadosTurmas));
app.get('/api/session', autenticar, (req, res) => res.json(req.session));

app.get('/diarios/start', async (req, res) => {
    const { mes, etapa } = req.query;
    if (!mes || !etapa) return res.status(400).send();

    dadosTurmas.statusDiario = "Coletando...";
    processarDiario(dadosTurmas.turmas, mes, etapa, (novas) => {
        dadosTurmas.turmas = novas;
        const total = dadosTurmas.turmas.reduce((a, t) => a + (t.prof?.length || 0), 0);
        const done = dadosTurmas.turmas.reduce((a, t) => a + (t.prof?.filter(p => p.statusDiario === true).length || 0), 0);
        if (done === total && total > 0) dadosTurmas.statusDiario = "Finalizado";
    });
    res.send("Iniciado");
});

app.get('/frequencia/start', async (req, res) => {
    const { mes, ano } = req.query;
    if (!mes || !ano) return res.status(400).send();

    dadosTurmas.statusFrequencia = "Coletando...";
    processarFrequencia(dadosTurmas.turmas, mes, ano, (novas) => {
        dadosTurmas.turmas = novas;
        const total = dadosTurmas.turmas.reduce((a, t) => a + (t.prof?.length || 0), 0);
        const done = dadosTurmas.turmas.reduce((a, t) => a + (t.prof?.filter(p => p.statusFrequencia === true).length || 0), 0);
        if (done === total && total > 0) dadosTurmas.statusFrequencia = "Finalizado";
    });
    res.send("Iniciado");
});

async function gerarExcel(res, templateName, tipo) {
    try {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(path.join(__dirname, 'excel', templateName));
        const ws = wb.getWorksheet(1);
        ws.autoFilter = undefined;

        for (let i = 6; i <= 301; i++) {
            const r = ws.getRow(i);
            ['B', 'C', 'D', 'E'].forEach(c => r.getCell(c).value = null);
        }

        const lista = [];
        dadosTurmas.turmas.forEach(t => {
            t.prof?.forEach(p => {
                const pend = tipo === 'diario' ? p.diarioPendente : p.frequenciaPendente;
                if (pend?.length > 0) {
                    lista.push({
                        prof: p.prof,
                        turma: t.nome,
                        disc: p.disciplina,
                        data: pend.map(d => d.substring(0, 5)).join(', ')
                    });
                }
            });
        });

        lista.sort((a, b) => a.prof.localeCompare(b.prof)).forEach((item, idx) => {
            const rowIdx = idx + 6;
            if (rowIdx <= 301) {
                const r = ws.getRow(rowIdx);
                r.getCell('B').value = item.prof;
                r.getCell('C').value = item.turma;
                r.getCell('D').value = item.disc;
                r.getCell('E').value = item.data;
                ['B', 'C', 'D', 'E'].forEach(c => {
                    r.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            }
        });

        ws.autoFilter = 'B5:E301';
        const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${tipo}-${date}.xlsx`);
        await wb.xlsx.write(res);
        res.end();
    } catch (e) { res.status(500).send(); }
}

app.get('/diarios/download', (req, res) => gerarExcel(res, 'diarios.xlsx', 'diario'));
app.get('/frequencia/download', (req, res) => gerarExcel(res, 'frequencia.xlsx', 'frequencia'));

app.get('/api/reset', async (req, res) => {
    limparTurmas();
    (await global.resetarColeta()) ? res.json({ success: true }) : res.status(500).json({ success: false });
});

app.get('/api/ping', (req, res) => {
    ultimaConexao = Date.now();
    res.sendStatus(200);
});

setInterval(() => {
    if (Date.now() - ultimaConexao > 3600000) {
        const b = browserManager.getBrowser();
        if (b) { b.removeAllListeners(); b.close().catch(() => { }); }
        setTimeout(() => process.exit(0), 1000);
    }
}, 10000);

function startServer() {
    return new Promise(resolve => {
        const s = app.listen(port, '127.0.0.1', () => resolve(s));
    });
}

const setTurmas = (d) => dadosTurmas = d;
const limparTurmas = () => dadosTurmas = { statusDiario: false, statusFrequencia: false, turmas: [] };

module.exports = { startServer, setTurmas };
