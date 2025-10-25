"use client"; // This must remain a client component

import { useState } from "react";

// Define the expected API response (which now contains HTML)
interface ApiResponse {
  html?: string;
  error?: string;
}

export default function Home() {
  const [quesId, setQesId] = useState<string>("");
  // This state will now hold the final HTML string
  const [solutionHtml, setSolutionHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSolution = async () => {
    if (!quesId) {
      setError("Please enter a Question ID.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSolutionHtml("");

    try {
      // 1. Call our API route
      const solutionRes = await fetch(`/api/get-solution?quesId=${quesId}`);

      const data: ApiResponse = await solutionRes.json();

      if (!solutionRes.ok || data.error) {
        throw new Error(data.error || `API request failed`);
      }

      // 2. Set the highlighted HTML
      if (data.html) {
        setSolutionHtml(data.html);
      } else {
        throw new Error("No solution HTML was returned.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW STYLES ---

  const glassStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
  };

  const buttonStyle: React.CSSProperties = {
    ...glassStyle,
    background: "rgba(255, 255, 255, 0.15)", // Slightly brighter
    padding: "12px 24px",
    fontSize: "1.1rem",
    cursor: "pointer",
    fontWeight: "600",
    color: "white",
    transition: "background 0.3s ease",
  };

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "rgba(255, 255, 255, 0.05)",
    color: "rgba(255, 255, 255, 0.5)",
    cursor: "not-allowed",
  };

  return (
    <main
      style={{
        padding: "2rem",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: "white",
        minHeight: "100vh",
        // Modern dark gradient background
        background: "linear-gradient(135deg, #1f005c, #000000)",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px", // Increased gap
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "2.5rem",
            fontWeight: "700",
          }}
        >
          Code Viewer
        </h1>

        {/* --- Input Group Glass Panel --- */}
        <div
          style={{
            ...glassStyle,
            padding: "20px",
            display: "flex",
            flexWrap: "wrap", // Allow wrapping on small screens
            gap: "15px",
            alignItems: "center",
          }}
        >
          <label
            htmlFor="quesId"
            style={{
              fontSize: "1.1rem",
              fontWeight: "500",
              flexShrink: 0, // Prevent label from shrinking
            }}
          >
            Question ID:
          </label>
          <input
            type="text"
            id="quesId"
            value={quesId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQesId(e.target.value)
            }
            placeholder="e.g., 1424"
            style={{
              flex: 1, // Take remaining space
              minWidth: "150px", // Ensure it's not too small
              background: "transparent",
              border: "none",
              borderBottom: "2px solid rgba(255, 255, 255, 0.5)",
              color: "white",
              fontSize: "1.1rem",
              padding: "8px 4px",
              outline: "none",
              transition: "border-color 0.3s ease",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderBottomColor =
                "rgba(255, 255, 255, 1)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderBottomColor =
                "rgba(255, 255, 255, 0.5)")
            }
          />
          <button
            onClick={fetchSolution}
            disabled={isLoading}
            style={isLoading ? buttonDisabledStyle : buttonStyle}
            // Add hover effects manually for inline styles
            onMouseOver={(e) => {
              if (!isLoading)
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseOut={(e) => {
              if (!isLoading)
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            }}
          >
            {isLoading ? "Loading..." : "Get Solution"}
          </button>
        </div>

        {/* --- Error Panel --- */}
        {error && (
          <div
            style={{
              ...glassStyle,
              background: "rgba(255, 100, 100, 0.15)", // Red glass
              border: "1px solid rgba(255, 100, 100, 0.3)",
              color: "#ffc7c7",
              padding: "20px",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            Error: {error}
          </div>
        )}

        {/* --- Code Viewer Glass Panel --- */}
        {solutionHtml && (
          <div
            style={{
              ...glassStyle,
              background: "rgba(0, 0, 0, 0.2)", // Darker glass for code
              backdropFilter: "blur(15px)",
              marginTop: "20px",
              overflow: "hidden", // Ensures inner <pre> respects border-radius
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: solutionHtml }} />
          </div>
        )}
      </div>
    </main>
  );
}
