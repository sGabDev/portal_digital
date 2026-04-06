async function realizarLogin(page, cpf, pass) {
    try {
        await page.goto('https://seges.sedu.es.gov.br/users/sign_in', { waitUntil: 'domcontentloaded' });
        
        await page.waitForSelector('#user_login');
        await page.type('#user_login', cpf);
        await page.type('#user_password', pass);

        await Promise.all([
            page.click('input[name="commit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);

        return await page.evaluate(() => !document.querySelector('#user_login'));
    } catch {
        return false;
    }
}

module.exports = { realizarLogin };