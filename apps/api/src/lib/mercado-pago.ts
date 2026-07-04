import { MercadoPagoConfig, Payment } from "mercadopago";

export type PixPaymentResult = {
  transactionId?: string;
  qrCode?: string;
  copyPaste?: string;
};

export async function createPixPayment(total: number, description: string): Promise<PixPaymentResult> {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      qrCode: "QR_CODE_DESENVOLVIMENTO",
      copyPaste: `00020126580014br.gov.bcb.pix0136zamai-salgados-${Date.now()}520400005303986540${total.toFixed(2)}5802BR`
    };
  }

  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);
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
