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
  Button,
} from "@react-email/components";
import * as React from "react";

export interface DispatchNotificationEmailProps {
  orderRef: string;
  customerName: string;
  dispatchType: "parcel" | "pallet";
  trackingNumber?: string | null;
  consignmentNumber?: string | null;
  carrierName?: string | null;
  certPackAttached: boolean;
  certPackUrl?: string | null;
  lines: Array<{
    product: string;
    qty: number;
    batchIds: string[];
  }>;
}

const TORKE_RED = "#C41E3A";

export function DispatchNotificationEmail({
  orderRef,
  customerName,
  dispatchType,
  trackingNumber,
  consignmentNumber,
  carrierName,
  certPackAttached,
  certPackUrl,
  lines,
}: DispatchNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          {/* Header bar */}
          <Section style={headerStyle}>
            <Text style={headerTextStyle}>TORKE</Text>
          </Section>

          <Section style={contentStyle}>
            <Text style={headingStyle}>Your Order Has Been Dispatched</Text>
            <Text style={greetingStyle}>Hi {customerName},</Text>
            <Text style={paragraphStyle}>
              Great news! Your order {orderRef} has been dispatched and is on its way to you.
            </Text>

            {/* Tracking section */}
            <Section style={trackingBoxStyle}>
              {dispatchType === "parcel" ? (
                <>
                  <Text style={trackingLabelStyle}>Dispatch Method</Text>
                  <Text style={trackingValueStyle}>Parcel Delivery</Text>
                  {carrierName && (
                    <>
                      <Text style={trackingLabelStyle}>Carrier</Text>
                      <Text style={trackingValueStyle}>{carrierName}</Text>
                    </>
                  )}
                  {trackingNumber && (
                    <>
                      <Text style={trackingLabelStyle}>Tracking Number</Text>
                      <Text style={{ ...trackingValueStyle, color: TORKE_RED, fontWeight: 700 }}>
                        {trackingNumber}
                      </Text>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={trackingLabelStyle}>Dispatch Method</Text>
                  <Text style={trackingValueStyle}>Pallet Delivery</Text>
                  {carrierName && (
                    <>
                      <Text style={trackingLabelStyle}>Haulier</Text>
                      <Text style={trackingValueStyle}>{carrierName}</Text>
                    </>
                  )}
                  {consignmentNumber && (
                    <>
                      <Text style={trackingLabelStyle}>Consignment Number</Text>
                      <Text style={{ ...trackingValueStyle, color: TORKE_RED, fontWeight: 700 }}>
                        {consignmentNumber}
                      </Text>
                    </>
                  )}
                </>
              )}
            </Section>

            {/* Line items summary */}
            <Text style={sectionHeadingStyle}>Items Dispatched</Text>
            <Section>
              <Row style={tableHeaderRowStyle}>
                <Column style={{ ...tableCellStyle, width: "50%" }}>
                  <Text style={tableHeaderTextStyle}>Product</Text>
                </Column>
                <Column style={{ ...tableCellStyle, width: "15%", textAlign: "center" as const }}>
                  <Text style={tableHeaderTextStyle}>Qty</Text>
                </Column>
                <Column style={{ ...tableCellStyle, width: "35%" }}>
                  <Text style={tableHeaderTextStyle}>Batch Ref(s)</Text>
                </Column>
              </Row>
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
                      {line.batchIds.length > 0 ? line.batchIds.join(", ") : "N/A"}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* Cert pack section */}
            {(certPackAttached || certPackUrl) && (
              <Section style={certPackBoxStyle}>
                <Text style={sectionHeadingStyle}>Certificate Pack</Text>
                {certPackAttached ? (
                  <Text style={paragraphStyle}>
                    Your certificate pack containing full batch traceability and EN 10204 3.1 mill certificates is attached to this email.
                  </Text>
                ) : certPackUrl ? (
                  <>
                    <Text style={paragraphStyle}>
                      Your certificate pack is too large to attach. Please download it using the link below (valid for 7 days):
                    </Text>
                    <Button href={certPackUrl} style={downloadButtonStyle}>
                      Download Certificate Pack
                    </Button>
                  </>
                ) : null}
              </Section>
            )}

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
  margin: "0 0 12px 0",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 700,
  color: TORKE_RED,
  margin: "20px 0 10px 0",
};

const trackingBoxStyle: React.CSSProperties = {
  backgroundColor: "#f0f7ff",
  border: "1px solid #cce0ff",
  borderRadius: "4px",
  padding: "16px",
  marginTop: "16px",
};

const trackingLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#666",
  margin: "8px 0 2px 0",
  textTransform: "uppercase" as const,
};

const trackingValueStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#1a1a1a",
  fontWeight: 600,
  margin: "0 0 4px 0",
};

const tableHeaderRowStyle: React.CSSProperties = {
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

const certPackBoxStyle: React.CSSProperties = {
  backgroundColor: "#f8fff8",
  border: "1px solid #c0e8c0",
  borderRadius: "4px",
  padding: "16px",
  marginTop: "16px",
};

const downloadButtonStyle: React.CSSProperties = {
  backgroundColor: TORKE_RED,
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "4px",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
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

export default DispatchNotificationEmail;
