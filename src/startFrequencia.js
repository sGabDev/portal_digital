const browserManager = require('./browserManager');

async function processarFrequencia(listaTurmas, mes, ano, callbackAtualizar) {
    const browser = browserManager.getBrowser();
    if (!browser) return;

    const tarefas = listaTurmas.flatMap(turma => {
        turma.frequencias = "PROCESSANDO";
        const classroomId = turma.link.split('/').pop();
        return classroomId ? turma.prof.map(disciplina => ({ turma, disciplina, classroomId })) : [];
    });

    const executarTarefa = async ({ turma, disciplina, classroomId }) => {
        const url = `https://seges.sedu.es.gov.br/absences/group_students?classroom_id=${classroomId}&competence=${mes}%2F${ano}&curriculum_discipline_id=${disciplina.id}`;
        
        for (let i = 0; i < 3; i++) {
            const page = await browser.newPage();
            try {
                await page.setRequestInterception(true);
                page.on('request', r => ['image', 'font', 'media', 'stylesheet', 'other'].includes(r.resourceType()) ? r.abort() : r.continue());

                const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                const dados = await response.json();

                if (dados?.classroom_lessons) {
                    const pendentes = dados.classroom_lessons
                        .filter(a => !a.closed)
                        .map(a => a.date.split('-').reverse().slice(0, 2).join('/'));

                    disciplina.frequenciaPendente = [...new Set(pendentes)];
                    disciplina.statusFrequencia = true;
                } else {
                    disciplina.frequenciaPendente = [];
                    disciplina.statusFrequencia = true;
                }
                break;
            } catch (err) {
                if (i === 2) {
                    disciplina.statusFrequencia = "ERRO";
                    disciplina.frequenciaPendente = [];
                }
            } finally {
                await page.close();
            }
        }

        if (turma.prof.every(p => p.statusFrequencia === true || p.statusFrequencia === "ERRO")) {
            turma.frequencias = "OK";
        }
        callbackAtualizar(listaTurmas);
    };

    const LIMIT = 10;
    for (let i = 0; i < tarefas.length; i += LIMIT) {
        await Promise.all(tarefas.slice(i, i + LIMIT).map(executarTarefa));
    }
}

module.exports = processarFrequencia;