# 🚀 Portal Digital | Gestão Inteligente SEGES

Automação de alta performance para análise de frequências e diários escolares.

O **Portal Digital** é uma solução independente desenvolvida para otimizar o fluxo de trabalho pedagógico na **EEEM Mário Gurgel (SRE Vila Velha - Sedu/ES)**.  
Através de **RPA (Robotic Process Automation)**, o sistema automatiza a conferência manual de diários e frequências atrasadas no sistema **SEGES**, transformando horas de conferência em segundos de processamento.

---

## 🛠️ Funcionalidades (Ultra Performance)

### 🔍 Auditoria de Frequência
Varredura automática em todas as turmas para identificar datas com lançamento pendente ou erro de fechamento.

### 📒 Controle de Diários
Verificação em tempo real de conteúdos **"Aguardando Planejamento"** ou falta de migração de dados.

### 📊 Relatórios em Excel
Geração de planilhas formatadas e prontas para impressão com o resumo de pendências por professor/disciplina.

### 🔐 Autenticação Segura
O robô utiliza as credenciais do próprio usuário para realizar login via protocolo HTTPS oficial do SEGES.

### ⚡ Engine de Alta Velocidade
Processamento multi-thread com controle de concorrência (até 10 turmas simultaneamente).

### 🌑 Operação Silenciosa
Execução em segundo plano (GUI mode), sem janelas de terminal invasivas.

### ♻️ Autogestão de Memória
Sistema de **Heartbeat (Ping)** que encerra o processo automaticamente ao fechar o navegador, evitando consumo desnecessário de RAM.

---

## 💻 Tecnologias Utilizadas

- **Runtime:** Node.js (v18+)  
- **Automação:** Puppeteer (Chromium Headless)  
- **Backend:** Express.js  
- **Interface:** HTML5 (Aurora UI Design) + Web Workers  
- **Manipulação de Dados:** ExcelJS  
- **Compilação:** PKG (Single Executable)

---

## 🚀 Como Executar

### 👤 Para Usuários (Executável)

1. Baixe o arquivo `Portal_Digital_Oficial.exe` na aba **Releases**  
2. Execute o arquivo  
3. O sistema abrirá automaticamente no navegador:  
   `http://localhost:3000`  
4. Insira suas credenciais do SEGES para iniciar  

---

### 👨‍💻 Para Desenvolvedores (Código-fonte)

```
# Clone o repositório
git clone https://github.com/sgabdev/portal_digital.git

# Instale as dependências
npm install

# Execute o projeto
node src/index.js
```

---

## ⚖️ Licença

Este projeto está licenciado sob a **GNU General Public License v3 (GPL-3.0)**.

- ✔️ Uso permitido  
- ✔️ Modificação permitida  
- ✔️ Distribuição permitida  
- ⚠️ Código derivado deve permanecer open-source (GPL-3.0)  
- ⚠️ Créditos do autor devem ser mantidos  

---

## ⚠️ Disclaimer

- Este software é um **projeto independente**  
- Não é um produto oficial da **SEDU/ES** ou do Governo do Estado  
- Desenvolvido de forma autônoma, sem uso de recursos institucionais  
- O autor não se responsabiliza por mau uso ou mudanças no sistema SEGES  

---

## 👤 Autor

- **Desenvolvido por:** Gabriel Souza Paula (sGabDev)  
- **Versão:** 4.0

---

> 💡 Projeto dedicado a professores, pedagogos e coordenadores pedagógicos que buscam excelência e agilidade na gestão pública escolar.
