const express = require('express');
const router = express.Router();

const pedidos = require('../data/orders.json');

router.get('/etiquetas', async (req, res) => {

    let etiquetas = '';

    pedidos.forEach(p => {
        etiquetas += `
            <div class="etiqueta">
                <div class="topo">
                    <img src="/img/logo.png" />
                    <span>DEVOLVA AQUI</span>
                </div>

                <div class="conteudo">
                    <strong>${p.nome}</strong><br>
                    ${p.endereco}<br>
                    ${p.cidade} - ${p.estado}
                </div>

                <div class="cep">${p.cep}</div>
            </div>
        `;
    });

    res.send(`
        <html>
        <head>
            <style>
                body {
                    margin: 0;
                    font-family: Arial, sans-serif;
                }

                .pagina {
                    width: 210mm;
                    padding: 10mm;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8mm;
                    box-sizing: border-box;
                }

                .etiqueta {
                    border: 2px solid #000;
                    height: 55mm;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-sizing: border-box;
                }

                .topo {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .topo img {
                    width: 30px;
                }

                .conteudo {
                    font-size: 12px;
                }

                .cep {
                    font-size: 20px;
                    font-weight: bold;
                    text-align: center;
                    border-top: 1px dashed #000;
                    padding-top: 5px;
                }

                @media print {
                    .etiqueta {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>

        <body onload="window.print()">
            <div class="pagina">
                ${etiquetas}
            </div>
        </body>
        </html>
    `);
});

module.exports = router;