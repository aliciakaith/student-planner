import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const MODEL = "claude-sonnet-4-20250514"

// Helper to stream text to a Response using Server-Sent Events
export async function streamToResponse(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>,
  onText?: (text: string) => void
): Promise<ReadableStream> {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text
            onText?.(text)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
