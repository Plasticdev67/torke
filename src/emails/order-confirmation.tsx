import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

export interface OrderConfirmationEmailProps {
  orderRef: string;
  customerName: string;
  orderDate: string;
  lines: Array<{
    product: string;
    qty: number;
    batchIds: string[];
  }>;
  paymentMethod: "card" | "credit" | "bacs";
  subtotalFormatted: string;
  vatFormatted: string;
  totalFormatted: string;
  poNumber?: string | null;
  deliveryAddress: {
    name: string;
    line1: string;
    line2?: string | null;
    city: string;
    postcode: string;
    siteContact?: string | null;
  };
}

const TORKE_RED = "#C41E3A";

export function OrderConfirmationEmail({
  orderRef,
  customerName,
  orderDate,
  lines,
  paymentMethod,
  subtotalFormatted,
  vatFormatted,
  totalFormatted,
  poNumber,
  deliveryAddress,
}: OrderConfirmationEmailProps) {
  const isAwaitingPayment = paymentMethod === "bacs";
  const heading = isAwaitingPayment ? "Order Received" : "Order Confirmed";

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header bar */}
          <Section style={headerStyle}>
            <Text style={headerTextStyle}>TORKE</Text>
          </Section>

          {/* Heading */}
          <Section style={contentStyle}>
            <Text style={headingStyle}>{heading}</Text>
            <Text style={greetingStyle}>Hi {customerName},</Text>
            <Text style={paragraphStyle}>
              {isAwaitingPayment
                ? `Thank you for your order. We have received your order ${orderRef} and it will be processed once payment is confirmed.`
                : `Thank you for your order. Your order ${orderRef} has been confirmed and is being processed.`}
            </Text>

            {/* Order details */}
            <Section style={detailBoxStyle}>
              <Text style={detailLabelStyle}>Order Reference: <span style={detailValueStyle}>{orderRef}</span></Text>
              <Text style={detailLabelStyle}>Date: <span style={detailValueStyle}>{orderDate}</span></Text>
              {poNumber && (
                <Text style={detailLabelStyle}>PO Number: <span style={detailValueStyle}>{poNumber}</span></Text>
              )}
              <Text style={detailLabelStyle}>Payment: <span style={detailValueStyle}>
                {paymentMethod === "card" ? "Card" : paymentMethod === "credit" ? "Credit Account" : "Bank Transfer (BACS)"}
              </span></Text>
            </Section>

            {/* Line items table */}
            <Text style={sectionHeadingStyle}>Order Items</Text>
            <Section>
              {/* Table header */}
              <Row style={tableHeaderStyle}>
                <Column style={{ ...tableCellStyle, width: "50%" }}>
                  <Text style={tableHeaderTextStyle}>Product</Text>
                </Column>
                <Column style={{ ...tableCellStyle, width: "15%", textAlign: "center" as const }}>
                  <Text style={tableHeaderTextStyle}>Qty</Text>
                </Column>
                <Column style={{ ...tableCellStyle, width: "35%" }}>
                  <Text style={tableHeaderTextStyle}>Batch ID(s)</Text>
                </Column>
              </Row>
              {/* Table rows */}
              {lines.map((line, i) => (
                <Row key={i} style={i % 2 === 0 ? tableRowEvenStyle : tableRowOddStyle}>
                  <Column style={{ ...tableCellStyle, width: "50%" }}>
                    <Text style={tableCellTextStyle}>{line.product}</Text>
                  </Column>
                  <Column style={{ ...tableCellStyle, width: "15%", textAlign: "center" as const }}>
                    <Text style={tableCellTextStyle}>{line.qty}</Text>
                  </Column>
                  <Column style={{ ...tableCellStyle, width: "35%" }}>
                    <Text style={tableCellTextStyle}>
                      {line.batchIds.length > 0 ? line.batchIds.join(", ") : "Pending"}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* Totals */}
            <Section style={totalsBoxStyle}>
              <Row>
                <Column style={{ width: "60%" }}><Text style={totalLabelStyle}>Subtotal</Text></Column>
                <Column style={{ width: "40%", textAlign: "right" as const }}><Text style={totalValueStyle}>{subtotalFormatted}</Text></Column>
              </Row>
              <Row>
                <Column style={{ width: "60%" }}><Text style={totalLabelStyle}>VAT (20%)</Text></Column>
                <Column style={{ width: "40%", textAlign: "right" as const }}><Text style={totalValueStyle}>{vatFormatted}</Text></Column>
              </Row>
              <Hr style={totalDividerStyle} />
              <Row>
                <Column style={{ width: "60%" }}><Text style={totalTotalLabelStyle}>Total</Text></Column>
                <Column style={{ width: "40%", textAlign: "right" as const }}><Text style={totalTotalValueStyle}>{totalFormatted}</Text></Column>
              </Row>
            </Section>

            {/* BACS bank details */}
            {isAwaitingPayment && (
              <Section style={bankDetailsBoxStyle}>
                <Text style={sectionHeadingStyle}>Payment Details</Text>
                <Text style={paragraphStyle}>
                  Please transfer the total amount using the details below, quoting your order reference as the payment reference.
                </Text>
                <Text style={detailLabelStyle}>Bank: <span style={detailValueStyle}>{process.env.TORKE_BANK_NAME ?? "Barclays Business"}</span></Text>
                <Text style={detailLabelStyle}>Sort Code: <span style={detailValueStyle}>{process.env.TORKE_SORT_CODE ?? "XX-XX-XX"}</span></Text>
                <Text style={detailLabelStyle}>Account Number: <span style={detailValueStyle}>{process.env.TORKE_ACCOUNT_NUMBER ?? "XXXXXXXX"}</span></Text>
                <Text style={detailLabelStyle}>Reference: <span style={{ ...detailValueStyle, color: TORKE_RED }}>{orderRef}</span></Text>
              </Section>
            )}

            {/* Delivery address */}
            <Text style={sectionHeadingStyle}>Delivery Address</Text>
            <Section style={addressBoxStyle}>
              <Text style={addressTextStyle}>{deliveryAddress.name}</Text>
              <Text style={addressTextStyle}>{deliveryAddress.line1}</Text>
              {deliveryAddress.line2 && <Text style={addressTextStyle}>{deliveryAddress.line2}</Text>}
              <Text style={addressTextStyle}>{deliveryAddress.city}, {deliveryAddress.postcode}</Text>
              {deliveryAddress.siteContact && (
                <Text style={{ ...addressTextStyle, color: "#666", marginTop: "4px" }}>
                  Site Contact: {deliveryAddress.siteContact}
                </Text>
              )}
            </Section>

            <Hr style={dividerStyle} />

            {/* Footer */}
            <Text style={footerTextStyle}>
              Torke Ltd | orders@torke.co.uk | +44 (0) 114 000 0000
            </Text>
            <Text style={footerTextStyle}>
              Unit 1, Industrial Estate, Sheffield, S1 1AA
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const bodyStyle: React.CSSProperties = {
  backgroundColor: "#f4f4f4",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: TORKE_RED,
  padding: "16px 24px",
};

const headerTextStyle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "2px",
};

const contentStyle: React.CSSProperties = {
  padding: "24px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  color: "#1a1a1a",
  margin: "0 0 8px 0",
};

const greetingStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#333",
  margin: "0 0 12px 0",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#444",
  margin: "0 0 16px 0",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: TORKE_RED,
  margin: "20px 0 10px 0",
};

const detailBoxStyle: React.CSSProperties = {
  backgroundColor: "#f9f9f9",
  padding: "12px 16px",
  borderRadius: "4px",
  marginBottom: "16px",
};

const detailLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#666",
  margin: "4px 0",
};

const detailValueStyle: React.CSSProperties = {
  fontWeight: 600,
  color: "#1a1a1a",
};

const tableHeaderStyle: React.CSSProperties = {
  backgroundColor: "#f0f0f0",
  borderBottom: "1px solid #ddd",
};

const tableHeaderTextStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#333",
  margin: "4px 0",
  textTransform: "uppercase" as const,
};

const tableCellStyle: React.CSSProperties = {
  padding: "6px 8px",
  verticalAlign: "top",
};

const tableCellTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#333",
  margin: "2px 0",
};

const tableRowEvenStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderBottom: "1px solid #eee",
};

const tableRowOddStyle: React.CSSProperties = {
  backgroundColor: "#fafafa",
  borderBottom: "1px solid #eee",
};

const totalsBoxStyle: React.CSSProperties = {
  padding: "12px 16px",
  marginTop: "8px",
};

const totalLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#666",
  margin: "2px 0",
};

const totalValueStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#333",
  margin: "2px 0",
};

const totalDividerStyle: React.CSSProperties = {
  borderColor: "#ddd",
  margin: "8px 0",
};

const totalTotalLabelStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#1a1a1a",
  margin: "2px 0",
};

const totalTotalValueStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: TORKE_RED,
  margin: "2px 0",
};

const bankDetailsBoxStyle: React.CSSProperties = {
  backgroundColor: "#fff8f8",
  border: `1px solid ${TORKE_RED}`,
  borderRadius: "4px",
  padding: "16px",
  marginTop: "16px",
};

const addressBoxStyle: React.CSSProperties = {
  backgroundColor: "#f9f9f9",
  padding: "12px 16px",
  borderRadius: "4px",
};

const addressTextStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#333",
  margin: "2px 0",
};

const dividerStyle: React.CSSProperties = {
  borderColor: "#eee",
  margin: "24px 0 16px 0",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#999",
  margin: "2px 0",
  textAlign: "center" as const,
};

export default OrderConfirmationEmail;
