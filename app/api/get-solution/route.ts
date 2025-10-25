import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createHighlighter } from "shiki";
import { bundledLanguages } from "shiki/langs";
import { bundledThemes } from "shiki/themes";

// Define the expected API response structure
interface ApiSolutionData {
  status: string;
  message: string;
  data?: {
    solution: string;
  };
}

// Define our new response structure (sending HTML)
interface ApiResponse {
  html?: string;
  error?: string;
  originalMessage?: string; // To pass along API messages
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  const { searchParams } = new URL(request.url);
  const quesId = searchParams.get("quesId");

  if (!quesId) {
    return NextResponse.json(
      { error: "Question ID is required" },
      { status: 400 }
    );
  }

  // Initialize Shiki highlighter
  const highlighter = await createHighlighter({
    themes: [bundledThemes["dark-plus"]],
    langs: [bundledLanguages["cpp"]],
  });

  try {
    // 4. Read the user_ids.txt file
    const filePath = path.join(process.cwd(), "user_ids.txt");
    const textData = fs.readFileSync(filePath, "utf8");

    // 5. Get all user IDs and shuffle them
    const userIds = textData.split("\n").filter(Boolean);
    if (userIds.length === 0) {
      return NextResponse.json(
        { error: "No user IDs found in user_ids.txt" },
        { status: 500 }
      );
    }

    // --- NEW: Shuffle the user ID array (Fisher-Yates Shuffle) ---
    for (let i = userIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [userIds[i], userIds[j]] = [userIds[j], userIds[i]];
    }

    // --- NEW: Set up retry logic ---
    const MAX_RETRIES = 3; // Try up to 3 different user IDs
    let lastErrorMessage = "Failed to retrieve solution after 3 attempts.";

    // Get the first few IDs to try, respecting the MAX_RETRIES
    const userIdsToTry = userIds.slice(
      0,
      Math.min(MAX_RETRIES, userIds.length)
    );

    // --- NEW: Loop and try fetching ---
    for (const userId of userIdsToTry) {
      try {
        const currentUserId = userId.trim();
        const apiUrl = `https://oahelper.in/solution-requests.php?action=get_solution&user_id=${currentUserId}&question_id=${quesId}`;

        const apiRes = await fetch(apiUrl);

        if (!apiRes.ok) {
          // Network error (404, 500, etc.)
          console.warn(
            `API request failed for user ${currentUserId}. Status: ${apiRes.status}`
          );
          lastErrorMessage = `API request failed (User: ${currentUserId}, Status: ${apiRes.status})`;
          continue; // Try the next user ID
        }

        const data: ApiSolutionData = await apiRes.json();

        // Check for logical success from your API
        if (data.status === "success" && data.data && data.data.solution) {
          const code = data.data.solution;
          const html = highlighter.codeToHtml(code, {
            lang: "cpp",
            theme: "dark-plus",
          });

          // SUCCESS: Found a working solution, return it immediately
          return NextResponse.json({ html: html });
        } else {
          // API was ok, but no solution (e.g., "solution not found")
          console.warn(
            `API returned non-success for user ${currentUserId}: ${data.message}`
          );
          lastErrorMessage = data.message || "API returned non-success.";
          continue; // Try the next user ID
        }
      } catch (fetchError) {
        // Catch individual fetch errors (e.g., DNS, connection refused)
        console.error(`Fetch error for user ${userId}:`, fetchError);
        lastErrorMessage =
          fetchError instanceof Error
            ? fetchError.message
            : "Unknown fetch error";
        continue; // Try the next user ID
      }
    }

    // --- NEW: If loop finishes, all retries failed ---
    return NextResponse.json({ error: lastErrorMessage }, { status: 404 });
  } catch (error) {
    // This is the outer catch for setup errors (shiki, file read)
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
