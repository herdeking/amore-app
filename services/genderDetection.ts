export const verifyPhotoGender = async (
  base64Image: string,
  userGender: string
): Promise<{ approved: boolean; reason?: string }> => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `This user registered as ${userGender}. Does this photo appear to show a ${userGender}? Reply with ONLY a JSON object like this: {"approved": true} or {"approved": false, "reason": "Photo appears to show a different gender than registered"}. No other text.`,
            },
          ],
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);
    return result;
  } catch (e) {
    // If AI check fails, allow the upload
    return { approved: true };
  }
};
