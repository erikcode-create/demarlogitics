Deno.serve(async (req) => {
  // Return TeXML that connects the inbound call to the AI Assistant
  const texml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <AIAssistant id="assistant-8daa8899-1e04-4372-8292-8536d464ea33">
        </AIAssistant>
    </Connect>
</Response>`

  return new Response(texml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  })
})
