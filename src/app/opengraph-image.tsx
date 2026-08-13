import { ImageResponse } from "next/og";

export const alt = "Sofiivka Water — партнерський магазин Ecosoft";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#071d33",
        color: "white",
        padding: "72px 78px",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: "-120px",
          top: "-180px",
          width: "620px",
          height: "620px",
          borderRadius: "50%",
          background: "#1597e5",
          opacity: 0.45,
        }}
      />
      <div style={{ display: "flex", fontSize: 46, fontWeight: 800, color: "#63c8ff" }}>
        ecosoft
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 880 }}>
        <div style={{ display: "flex", fontSize: 66, lineHeight: 1.05, fontWeight: 800 }}>
          Чиста вода для дому та бізнесу
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 27, color: "#cfeaff" }}>
          Підбір, доставка, монтаж і сервіс систем Ecosoft
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 23, color: "#9ec9e5" }}>
        sofiivkawater.com
      </div>
    </div>,
    size,
  );
}
