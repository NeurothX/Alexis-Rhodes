const { iniciarPiedraPapelTijera } = require("../../systems/rpsSystem");

module.exports = async function ppt(sock, msg) {
    await iniciarPiedraPapelTijera(sock, msg);
};
