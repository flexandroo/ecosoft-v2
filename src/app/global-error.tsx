"use client";

import { useEffect } from "react";

/** Last-resort fallback when the root layout itself fails (it replaces <html>). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="uk">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f5f8fc", color: "#0f172a" }}>
        <main style={{ maxWidth: 520, margin: "15vh auto", padding: "0 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 26, marginBottom: 12 }}>Сайт тимчасово недоступний</h1>
          <p style={{ color: "#475569", lineHeight: 1.5 }}>Спробуйте оновити сторінку за хвилину.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              height: 44,
              padding: "0 20px",
              border: 0,
              borderRadius: 12,
              background: "#006bd6",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Спробувати ще раз
          </button>
        </main>
      </body>
    </html>
  );
}
