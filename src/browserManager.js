let browserInstance = null;

module.exports = {
    setBrowser: (browser) => { browserInstance = browser; },
    getBrowser: () => {
        if (!browserInstance) throw new Error("Browser não foi iniciado!");
        return browserInstance;
    }
};