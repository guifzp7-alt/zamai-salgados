"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPixPayment = createPixPayment;
const mercadopago_1 = require("mercadopago");
async function createPixPayment(total, description) {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
        return {
            qrCode: "QR_CODE_DESENVOLVIMENTO",
            copyPaste: `00020126580014br.gov.bcb.pix0136zamai-salgados-${Date.now()}520400005303986540${total.toFixed(2)}5802BR`
        };
    }
    const client = new mercadopago_1.MercadoPagoConfig({ accessToken });
    const payment = new mercadopago_1.Payment(client);
    const response = await payment.create({
        body: {
            transaction_amount: total,
            description,
            payment_method_id: "pix",
            payer: {
                email: "cliente@zamai-salgados.local"
            }
        }
    });
    return {
        transactionId: response.id?.toString(),
        qrCode: response.point_of_interaction?.transaction_data?.qr_code_base64,
        copyPaste: response.point_of_interaction?.transaction_data?.qr_code
    };
}
