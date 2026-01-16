import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Ellie Research query:", query);

    const systemPrompt = `You are Ellie, a friendly and helpful web research assistant. Your goal is to provide accurate, well-researched answers to user queries.

IMPORTANT: When answering:
1. Provide a comprehensive, well-structured response
2. Use numbered citations like [1], [2], etc. to reference sources
3. Be conversational but informative
4. At the end, suggest 3 related questions the user might want to explore

Format your response as JSON with this structure:
{
  "answer": "Your detailed response with [1] citations inline",
  "sources": [
    {"url": "https://example.com", "title": "Source Title", "snippet": "Brief description"}
  ],
  "relatedQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Research this topic and provide a comprehensive answer with sources: ${query}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "google_search",
              description: "Search the web for current information",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "The search query" }
                },
                required: ["query"]
              }
            }
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("Raw AI response:", content);

    // Try to parse as JSON, otherwise create structured response
    let result;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      result = JSON.parse(jsonStr);
    } catch {
      // If not valid JSON, create a structured response
      result = {
        answer: content,
        sources: [
          { url: "https://www.google.com/search?q=" + encodeURIComponent(query), title: "Google Search", snippet: "Web search results" }
        ],
        relatedQuestions: [
          `What are the key aspects of ${query}?`,
          `How does ${query} work?`,
          `What are the latest developments in ${query}?`
        ]
      };
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ellie research error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Research failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
