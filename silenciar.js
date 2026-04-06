const fs = require('fs');
const path = require('path');

const exePath = path.join(__dirname, 'portal-ultra.exe');

try {
    const buffer = fs.readFileSync(exePath);
    const peOffset = buffer.readUInt32LE(0x3c);
    
    const subsystemOffset = peOffset + 0x5c;

    buffer.writeUInt16LE(2, subsystemOffset);

    fs.writeFileSync(exePath, buffer);

    console.log('--------------------------------------------------');
    console.log('✅ SUCESSO: O executável agora é SILENCIOSO!');
    console.log('💡 Agora, ao abrir o .exe, o CMD não aparecerá.');
    console.log('--------------------------------------------------');
} catch (err) {
    console.error('❌ ERRO AO MODIFICAR O EXE:', err.message);
    console.log('Certifique-se de que o portal-ultra.exe NÃO está aberto agora.');
}