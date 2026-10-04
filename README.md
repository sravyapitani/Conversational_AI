# Conversational_AI - Convai Web SDK Interactive Studio

Interact with your favorite conversational AI characters from the web browser with real-time bidirectional audio streaming, ARKit 52 facial blendshapes, lipsync visemes, and narrative triggers.

---

### 🚀 Running the Interactive Studio Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Launch the Web Studio**:
   ```bash
   node server.js
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:3000` to access the full interactive studio, voice microphone console, ARKit telemetry bars, and gRPC debug event logs.

---

### 💻 SDK Usage Examples

Following examples use TypeScript bindings:

```ts
import { ConvaiClient } from 'convai-web-sdk';
import { GetResponseResponse } from "convai-web-sdk/dist/_proto/service/service_pb";

// Initiate the convai client.
const convaiClient = useRef(null);
convaiClient.current = new ConvaiClient({
      apiKey: string, //Enter your API Key here,
      characterId: string, //Enter your Character ID,
      enableAudio: boolean, //No character audio will be played but will be generated.
      sessionId: string, //current conversation session. Can be used to retrieve chat history. 
      languageCode?: string, 
      textOnlyResponse?: boolean, //Optional parameter for chat only applications (No audio response from character)
      micUsage?: boolean, // Option parameter for no microphone usage and access
      enableFacialData?: boolean, // Optional for viseme data generation used for lipsync and expression
      faceModel?: 3,
      narrativeTemplateKeysMap: Map<string, string>, //dynamically pass variables to the Narrative Design section and triggers
 });

// Set a response callback. This may fire multiple times as response
// can come in multiple parts.
convaiClient.setResponseCallback((response: GetResponseResponse) => {
    // live transcript, only available during audio mode.
    if (response.hasUserQuery()) {
        var transcript = response!.getUserQuery();
        var isFinal = response!.getIsFinal();
    }
    if (response.hasAudioResponse()) {
        var audioResponse = response?.getAudioResponse();
        if (audioResponse.hasTextData()) {
            // Response text.
            console.log(audioResponse?.getTextData());
        }
        if (audioResponse.hasAudioData()) {
            // Play or process audio response.
            var audioByteArray: UInt8Array = audioResponse!.getAudioData_asU8();
        }
    }

    // Actions coming soon!
});

// Send text input
var text = "How are you?";
convaiClient.sendTextChunk(text);

// Send audio chunks.
// Starts audio recording using default microphone.
convaiClient.startAudioChunk();

// Stop recording and finish submitting input.
convaiClient.endAudioChunk();

// End or Reset a conversation session.
convaiClient.resetSession();
```

---

### 🎭 Facial Expressions & Blendshapes

To kickstart facial expression functionality, initialize the `ConvaiClient` with the necessary parameters. The `enableFacialData` flag must be set to `true` to enable facial expression data.

```javascript
convaiClient.current = new ConvaiClient({
  apiKey: '<apiKey>',
  characterId: '<characterId>',
  enableAudio: true,
  enableFacialData: true,
  faceModel: 3, // OVR lipsync or ARKit blendshapes
});
```
[Further Documentation](https://docs.convai.com/api-docs/plugins-and-integrations/convai-web-sdk/facial-expressions)

---

## Reference Videos
**Convai-Npc World (React Three Fiber):**
* GitHub: [Conv-AI/ThreeJs-World-Tutorial](https://github.com/Conv-AI/ThreeJs-World-Tutorial)
* Tutorial Video: [Watch Video](https://www.youtube.com/watch?v=hOqtVLGXwKU)
* Hosted Link: [Interactive.convai.com](https://interactive.convai.com/)

## Real Time Lipsync with Reallusion Characters:

* GitHub: [Conv-AI/Reallusion-lipsync-web](https://github.com/Conv-AI/Reallusion-lipsync-web)

## NPM
[convai-web-sdk](https://www.npmjs.com/package/convai-web-sdk)
