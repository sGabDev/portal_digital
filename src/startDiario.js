const browserManager = require('./browserManager');

async function processarDiario(listaTurmas, mes, etapa, callbackAtualizar) {
    const browser = browserManager.getBrowser();
    if (!browser) return console.error("Browser não iniciado.");

    const tarefas = [];
    listaTurmas.forEach(turma => {
        turma.diarios = "PROCESSANDO";
        turma.prof.forEach(disciplina => {
            tarefas.push({ turma, disciplina });
        });
    });

    const processarUmaDisciplina = async (tarefa, maxRetries = 3) => {
        const { turma, disciplina } = tarefa;
        const linkFinal = disciplina.link
            .replace("#MES", encodeURIComponent(mes))
            .replace("#ETAPA", encodeURIComponent(etapa));

        let attempt = 0;
        let sucesso = false;

        while (attempt < maxRetries && !sucesso) {
            const page = await browser.newPage();
            try {
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    const type = req.resourceType();
                    if (['image', 'font', 'media', 'stylesheet', 'other'].includes(type)) req.abort();
                    else req.continue();
                });

                await page.goto(linkFinal, { waitUntil: 'domcontentloaded', timeout: 20000 });

                const dados = await page.evaluate(() => {
                    const dts = Array.from(document.querySelectorAll('dt'));
                    const dtProf = dts.find(dt => dt.textContent.includes('Professor(es)'));
                    const nomeProfessor = dtProf ? dtProf.nextElementSibling.innerText.trim() : "Não encontrado";

                    const pendentes = [];
                    const tabelas = document.querySelectorAll('table.table-striped');
                    const tabelaConteudo = tabelas[1];

                    if (tabelaConteudo) {
                        const rows = Array.from(tabelaConteudo.querySelectorAll('tbody tr'));
                        rows.forEach(row => {
                            const colunas = row.querySelectorAll('th, td');
                            if (colunas.length >= 3) {
                                const data = colunas[0].innerText.trim();
                                const conteudo = colunas[2].innerText.trim();
                                if (conteudo.includes("Aguardando planejamento")) pendentes.push(data);
                            }
                        });
                    }
                    return { nomeProfessor, pendentes };
                });

                disciplina.prof = dados.nomeProfessor;
                disciplina.diarioPendente = dados.pendentes;
                disciplina.statusDiario = true;
                sucesso = true;

            } catch (err) {
                attempt++;
                console.error(`⚠️ Tentativa ${attempt} falhou: ${turma.nome} - ${disciplina.disciplina}`);
                if (attempt === maxRetries) disciplina.statusDiario = "ERRO";
            } finally {
                await page.close();
            }
        }

        const todasConcluidas = turma.prof.every(p => p.statusDiario === true || p.statusDiario === "ERRO");
        if (todasConcluidas) {
            turma.diarios = "OK";
        }

        callbackAtualizar(listaTurmas);
    };

    const CONCURRENCY_LIMIT = 10;
    for (let i = 0; i < tarefas.length; i += CONCURRENCY_LIMIT) {
        const chunk = tarefas.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(chunk.map(tarefa => processarUmaDisciplina(tarefa)));
    }
}

module.exports = processarDiario;