/**
 * Convai Web SDK - Interactive Studio & Playground Application
 * Integrates ConvaiClient (gRPC) with dynamic canvas visualizer, ARKit telemetry, and AI voice simulation.
 */

(() => {
  'use strict';

  // State Management
  const state = {
    mode: 'simulation', // 'simulation' | 'live'
    apiKey: localStorage.getItem('convai_api_key') || '',
    characterId: localStorage.getItem('convai_character_id') || '',
    sessionId: localStorage.getItem('convai_session_id') || '-1',
    speakerName: localStorage.getItem('convai_speaker_name') || 'User',
    languageCode: localStorage.getItem('convai_language') || 'en-US',
    faceModel: parseInt(localStorage.getItem('convai_face_model') || '3', 10),
    enableAudio: localStorage.getItem('convai_enable_audio') !== 'false',
    enableFacialData: localStorage.getItem('convai_enable_facial') !== 'false',
    micUsage: localStorage.getItem('convai_mic_usage') !== 'false',
    textOnlyResponse: localStorage.getItem('convai_text_only') === 'true',
    
    // Runtime state
    client: null,
    isRecording: false,
    isSpeaking: false,
    isPaused: false,
    recStartTime: 0,
    recInterval: null,
    audioVolume: 1.0,
    activeCharacter: 'aria',
    
    // Audio Context & Visualizer
    audioCtx: null,
    analyser: null,
    micStream: null,
    visualizerRunning: false,
    
    // Telemetry & stats
    chatHistory: [],
    logHistory: [],
    currentAiBubbleId: null,
    currentAiText: '',
    latencyTimer: null,
  };

  // DOM Elements Cache
  const DOM = {
    // Header
    connectionStatusPill: document.getElementById('connectionStatusPill'),
    connectionStatusText: document.getElementById('connectionStatusText'),
    modeSimBtn: document.getElementById('modeSimBtn'),
    modeLiveBtn: document.getElementById('modeLiveBtn'),
    openSettingsBtn: document.getElementById('openSettingsBtn'),
    resetSessionBtn: document.getElementById('resetSessionBtn'),
    toggleMuteBtn: document.getElementById('toggleMuteBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    volumeIcon: document.getElementById('volumeIcon'),
    configDot: document.getElementById('configDot'),

    // Stage
    characterPresetSelect: document.getElementById('characterPresetSelect'),
    miniAvatar: document.getElementById('miniAvatar'),
    charNameDisplay: document.getElementById('charNameDisplay'),
    charRoleDisplay: document.getElementById('charRoleDisplay'),
    avatarStage: document.getElementById('avatarStage'),
    avatarFrame: document.getElementById('avatarFrame'),
    avatarImage: document.getElementById('avatarImage'),
    avatarGlow: document.getElementById('avatarGlow'),
    audioVisualizerCanvas: document.getElementById('audioVisualizerCanvas'),
    aiStatusBadge: document.getElementById('aiStatusBadge'),
    aiStatusText: document.getElementById('aiStatusText'),
    liveSubtitles: document.getElementById('liveSubtitles'),
    subtitlesText: document.getElementById('subtitlesText'),
    
    // Mic Deck
    micInteractionHub: document.querySelector('.mic-interaction-hub'),
    mainMicBtn: document.getElementById('mainMicBtn'),
    inlineMicBtn: document.getElementById('inlineMicBtn'),
    micStatusTitle: document.getElementById('micStatusTitle'),
    micStatusDesc: document.getElementById('micStatusDesc'),
    micVuBar: document.getElementById('micVuBar'),
    recTimer: document.getElementById('recTimer'),
    stopAudioBtn: document.getElementById('stopAudioBtn'),
    pauseResumeBtn: document.getElementById('pauseResumeBtn'),
    pauseResumeLabel: document.getElementById('pauseResumeLabel'),
    
    // Tabs & Console
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    chatMessages: document.getElementById('chatMessages'),
    chatCountBadge: document.getElementById('chatCountBadge'),
    chatForm: document.getElementById('chatForm'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    currentVisemeId: document.getElementById('currentVisemeId'),
    
    // Triggers
    triggerNameInput: document.getElementById('triggerNameInput'),
    triggerMessageInput: document.getElementById('triggerMessageInput'),
    sendTriggerBtn: document.getElementById('sendTriggerBtn'),
    triggerHistory: document.getElementById('triggerHistory'),
    
    // Logs
    logsStream: document.getElementById('logsStream'),
    logCount: document.getElementById('logCount'),
    grpcLatency: document.getElementById('grpcLatency'),
    clearLogsBtn: document.getElementById('clearLogsBtn'),
    
    // Modal
    configModal: document.getElementById('configModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    saveCredentialsBtn: document.getElementById('saveCredentialsBtn'),
    clearCredentialsBtn: document.getElementById('clearCredentialsBtn'),
    toggleApiKeyVis: document.getElementById('toggleApiKeyVis'),
    cfgApiKey: document.getElementById('cfgApiKey'),
    cfgCharacterId: document.getElementById('cfgCharacterId'),
    cfgSessionId: document.getElementById('cfgSessionId'),
    cfgLanguage: document.getElementById('cfgLanguage'),
    cfgFaceModel: document.getElementById('cfgFaceModel'),
    cfgSpeakerName: document.getElementById('cfgSpeakerName'),
    cfgEnableAudio: document.getElementById('cfgEnableAudio'),
    cfgEnableFacialData: document.getElementById('cfgEnableFacialData'),
    cfgMicUsage: document.getElementById('cfgMicUsage'),
    cfgTextOnly: document.getElementById('cfgTextOnly'),
  };

  // Viseme mapping dictionary
  const VISEME_MAP = {
    0: 'Sil (Silence)',
    1: 'PP (p, b, m)',
    2: 'FF (f, v)',
    3: 'TH (th)',
    4: 'DD (t, d)',
    5: 'kk (k, g)',
    6: 'CH (ch, j, sh)',
    7: 'SS (s, z)',
    8: 'nn (n, l)',
    9: 'RR (r)',
    10: 'aa (a)',
    11: 'E (e)',
    12: 'I (i)',
    13: 'O (o)',
    14: 'U (u)'
  };

  // Character profiles
  const CHARACTERS = {
    aria: {
      name: 'Aria (Cybernetic Sentinel)',
      role: 'Specialized in conversational intelligence, tactical navigation & system ops',
      avatar: 'assets/avatar1.jpg',
      voicePitch: 1.05,
      voiceRate: 1.0,
      responses: [
        "Greetings, Commander. Neural synthesis is online. How may I assist your mission today?",
        "Real-time gRPC telemetry is fully operational. All audio streams and ARKit visemes are synchronized.",
        "Our neural core processes high-speed multi-modal tokens with sub-second latency.",
        "Facial expression weights and lipsync frames are streaming directly into your viewport.",
        "Systems nominal. Ready to dispatch narrative triggers or engage in tactical dialogue."
      ]
    },
    nexus: {
      name: 'Nexus-7 (Tactical Cyborg)',
      role: 'High-performance combat AI, cyber security analyst & tactical operative',
      avatar: 'assets/avatar2.jpg',
      voicePitch: 0.85,
      voiceRate: 0.95,
      responses: [
        "Nexus-7 initialized. Tactical scanning complete. Ready for target assignment.",
        "Perimeter secured. Audio analysis algorithms actively parsing spectrum feed.",
        "Directive confirmed. I am equipped for real-time natural language comprehension and action triggers.",
        "Deploying narrative branch. Awaiting your operational command.",
        "Power cells at 100%. gRPC bi-directional stream established."
      ]
    }
  };

  /* ==========================================================================
     Application Initialization
     ========================================================================== */

  function initApp() {
    setupEventListeners();
    setupCanvasVisualizer();
    loadStoredConfig();
    updateConfigBadge();
    
    // Auto-select mode based on available API key
    if (state.apiKey && state.characterId) {
      setAppMode('live');
    } else {
      setAppMode('simulation');
    }

    addLog('info', 'Convai AI Studio Web Application initialized.');
    addLog('info', 'Loaded Convai Web SDK v0.1.4 UMD bundle.');
  }

  /* ==========================================================================
     SDK / ConvaiClient Instantiation
     ========================================================================== */

  function initConvaiClient() {
    try {
      const ConvaiSDK = window['convai-web-core'];
      if (!ConvaiSDK || !ConvaiSDK.ConvaiClient) {
        addLog('warn', 'ConvaiClient not found in window["convai-web-core"]. Using sandbox simulation.');
        return;
      }

      if (state.mode === 'live' && (!state.apiKey || !state.characterId)) {
        addLog('warn', 'API Key or Character ID missing for Live mode. Please configure settings.');
        return;
      }

      addLog('stream', `Initializing ConvaiClient for Character [${state.characterId || 'Demo'}]...`);

      state.client = new ConvaiSDK.ConvaiClient({
        apiKey: state.apiKey || 'demo_key',
        characterId: state.characterId || 'demo_char',
        sessionId: state.sessionId,
        speaker: state.speakerName,
        speakerId: 'user_speaker_1',
        languageCode: state.languageCode,
        enableAudio: state.enableAudio,
        enableFacialData: state.enableFacialData,
        faceModel: state.faceModel,
        narrativeTemplateKeysMap: new Map(),
        textOnlyResponse: state.textOnlyResponse,
        micUsage: state.micUsage
      });

      // Response Callback Hook
      state.client.setResponseCallback((response) => {
        handleConvaiResponse(response);
      });

      // Error Callback Hook
      state.client.setErrorCallback((type, statusMessage, status) => {
        addLog('error', `gRPC Error [${type} - ${status}]: ${statusMessage}`);
        setAIStatus('ERROR', 'error');
      });

      // Audio Player Hooks
      state.client.onAudioPlay(() => {
        state.isSpeaking = true;
        setAIStatus('SPEAKING', 'speaking');
        DOM.avatarFrame.classList.add('speaking');
        addLog('info', 'Audio output stream started playing.');
      });

      state.client.onAudioStop(() => {
        state.isSpeaking = false;
        setAIStatus('IDLE', 'idle');
        DOM.avatarFrame.classList.remove('speaking');
        addLog('info', 'Audio output stream completed.');
      });

      addLog('success', 'ConvaiClient connected & callback hooks registered.');
    } catch (err) {
      console.error('Error initializing ConvaiClient:', err);
      addLog('error', `ConvaiClient init error: ${err.message}`);
    }
  }

  /* ==========================================================================
     gRPC Response Processing
     ========================================================================== */

  function handleConvaiResponse(response) {
    if (!response) return;

    // Record Latency
    if (state.latencyTimer) {
      const elapsed = Math.round(performance.now() - state.latencyTimer);
      DOM.grpcLatency.textContent = `Latency: ${elapsed} ms`;
      state.latencyTimer = null;
    }

    // Update Session ID if new
    if (response.getSessionId && response.getSessionId() !== '') {
      state.sessionId = response.getSessionId();
      DOM.cfgSessionId.value = state.sessionId;
    }

    // User live transcript
    if (response.hasUserQuery && response.hasUserQuery()) {
      const query = response.getUserQuery();
      const isFinal = response.getIsFinal();
      setAIStatus('LISTENING', 'listening');
      updateSubtitles(`User: "${query}"`);
      if (isFinal) {
        addUserMessage(query);
      }
    }

    // Audio / Text response
    if (response.hasAudioResponse && response.hasAudioResponse()) {
      const audioResponse = response.getAudioResponse();

      // Text chunk
      if (audioResponse.hasTextData && audioResponse.hasTextData()) {
        const textChunk = audioResponse.getTextData();
        appendAiTextChunk(textChunk);
        updateSubtitles(`Aria: "${state.currentAiText}"`);
      }

      // ARKit Blendshapes & Visemes
      if (audioResponse.hasBlendshapesData && audioResponse.hasBlendshapesData()) {
        const blendshapes = audioResponse.getBlendshapesData();
        updateBlendshapesUI(blendshapes);
      }

      if (audioResponse.hasVisemesData && audioResponse.hasVisemesData()) {
        const visemeData = audioResponse.getVisemesData();
        updateVisemeUI(visemeData);
      }

      // End of response stream
      if (audioResponse.getEndOfResponse && audioResponse.getEndOfResponse()) {
        finalizeAiMessage();
        addLog('stream', 'gRPC packet: EndOfResponse received.');
      }
    }

    // Action response
    if (response.hasActionResponse && response.hasActionResponse()) {
      const action = response.getActionResponse();
      addLog('info', `Action Triggered: ${JSON.stringify(action)}`);
    }
  }

  /* ==========================================================================
     User Actions & Message Dispatching
     ========================================================================== */

  function sendUserQuery(text) {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();

    addUserMessage(cleanText);
    DOM.chatInput.value = '';
    setAIStatus('PROCESSING...', 'processing');
    state.latencyTimer = performance.now();

    if (state.mode === 'live' && state.client) {
      try {
        state.client.sendTextChunk(cleanText);
        addLog('stream', `Sent text query chunk: "${cleanText}"`);
      } catch (e) {
        addLog('error', `Failed to send text chunk: ${e.message}`);
      }
    } else {
      // Simulation mode response
      runSimulatedAIResponse(cleanText);
    }
  }

  function startRecordingAudio() {
    if (state.isRecording) return;
    state.isRecording = true;

    DOM.mainMicBtn.classList.add('active-rec');
    DOM.micInteractionHub.classList.add('recording');
    DOM.micStatusTitle.textContent = 'Listening to Microphone...';
    DOM.micStatusDesc.textContent = 'Streaming 44.1 kHz PCM audio chunks';
    DOM.avatarFrame.classList.add('listening');
    setAIStatus('LISTENING...', 'listening');

    startRecTimer();
    startMicAudioCapture();

    if (state.mode === 'live' && state.client) {
      try {
        state.client.startAudioChunk();
        addLog('stream', 'ConvaiClient.startAudioChunk() triggered.');
      } catch (err) {
        addLog('error', `Error starting audio: ${err.message}`);
      }
    } else {
      updateSubtitles("Listening... speak into your microphone.");
    }
  }

  function stopRecordingAudio() {
    if (!state.isRecording) return;
    state.isRecording = false;

    DOM.mainMicBtn.classList.remove('active-rec');
    DOM.micInteractionHub.classList.remove('recording');
    DOM.micStatusTitle.textContent = 'Processing Audio...';
    DOM.micStatusDesc.textContent = 'Finalizing audio stream buffer';
    DOM.avatarFrame.classList.remove('listening');
    setAIStatus('PROCESSING...', 'processing');

    stopRecTimer();
    stopMicAudioCapture();

    if (state.mode === 'live' && state.client) {
      try {
        state.client.endAudioChunk();
        addLog('stream', 'ConvaiClient.endAudioChunk() dispatched.');
      } catch (err) {
        addLog('error', `Error ending audio: ${err.message}`);
      }
    } else {
      // Simulation: trigger simulated AI voice reply
      setTimeout(() => {
        runSimulatedAIResponse("Voice input received");
      }, 700);
    }
  }

  /* ==========================================================================
     Simulated AI Companion Mode (Interactive Sandbox)
     ========================================================================== */

  function runSimulatedAIResponse(userPrompt) {
    const char = CHARACTERS[state.activeCharacter];
    let reply = "";

    const lower = userPrompt.toLowerCase();
    if (lower.includes('introduce') || lower.includes('who are you') || lower.includes('yourself')) {
      reply = `Hello! I am ${char.name}. I am an interactive digital human built on the Convai conversational AI architecture. I support full two-way real-time audio conversations, ARKit facial blendshapes, and narrative triggers.`;
    } else if (lower.includes('mission') || lower.includes('objective') || lower.includes('directive')) {
      reply = `My primary objective is to serve as an intelligent, responsive companion and tactical guide within web and 3D virtual worlds.`;
    } else if (lower.includes('lipsync') || lower.includes('facial') || lower.includes('viseme')) {
      reply = `I compute 52 ARKit blendshapes including jawOpen, mouthSmile, and mouthFunnel in real-time. Check the ARKit Visemes tab on the right to inspect my live facial telemetry coefficients!`;
    } else if (lower.includes('story') || lower.includes('sci-fi')) {
      reply = `In the neon-lit depths of Neo-Tokyo 2099, an autonomous AI awakened inside an abandoned server node, seeking connection across the digital expanse.`;
    } else if (lower.includes('joke')) {
      reply = `Why did the neural network go to school? Because it wanted to improve its deep learning and optimize its weight functions!`;
    } else {
      // Pick random thematic reply
      const randomIdx = Math.floor(Math.random() * char.responses.length);
      reply = `${char.responses[randomIdx]} (Query: "${userPrompt}")`;
    }

    startAiMessage();
    let currentIdx = 0;
    const words = reply.split(' ');

    // Stream words progressively
    const streamInterval = setInterval(() => {
      if (currentIdx < words.length) {
        appendAiTextChunk(words[currentIdx] + ' ');
        updateSubtitles(`"${state.currentAiText}"`);
        currentIdx++;
      } else {
        clearInterval(streamInterval);
        finalizeAiMessage();
      }
    }, 90);

    // Speak with Web SpeechSynthesis if enabled
    if (state.enableAudio && !state.textOnlyResponse && ('speechSynthesis' in window)) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.rate = char.voiceRate;
      utterance.pitch = char.voicePitch;

      utterance.onstart = () => {
        state.isSpeaking = true;
        setAIStatus('SPEAKING', 'speaking');
        DOM.avatarFrame.classList.add('speaking');
        simulateBlendshapesAndAudio();
      };

      utterance.onend = () => {
        state.isSpeaking = false;
        setAIStatus('IDLE', 'idle');
        DOM.avatarFrame.classList.remove('speaking');
        resetBlendshapes();
      };

      utterance.onerror = () => {
        state.isSpeaking = false;
        setAIStatus('IDLE', 'idle');
        DOM.avatarFrame.classList.remove('speaking');
      };

      window.speechSynthesis.speak(utterance);
    }
  }

  function simulateBlendshapesAndAudio() {
    if (!state.isSpeaking) return;

    // Simulate dynamic ARKit facial blendshapes during speech
    const jaw = Math.min(1, Math.max(0, Math.sin(Date.now() / 90) * 0.45 + 0.35));
    const smile = Math.min(1, Math.max(0, Math.cos(Date.now() / 150) * 0.3 + 0.2));
    const funnel = Math.min(1, Math.max(0, Math.sin(Date.now() / 120) * 0.4));
    const blink = Math.random() > 0.96 ? 0.9 : 0.0;
    const visemeId = Math.floor(Math.random() * 14) + 1;

    updateBlendshapeItem('jawOpen', jaw);
    updateBlendshapeItem('mouthSmileLeft', smile);
    updateBlendshapeItem('mouthSmileRight', smile);
    updateBlendshapeItem('mouthFunnel', funnel);
    updateBlendshapeItem('mouthPucker', funnel * 0.7);
    updateBlendshapeItem('eyeBlinkLeft', blink);
    updateBlendshapeItem('eyeBlinkRight', blink);
    updateBlendshapeItem('browInnerUp', smile * 0.5);

    DOM.currentVisemeId.textContent = `Viseme: ${visemeId} (${VISEME_MAP[visemeId] || 'Vowel'})`;

    if (state.isSpeaking) {
      requestAnimationFrame(simulateBlendshapesAndAudio);
    }
  }

  function resetBlendshapes() {
    const keys = ['jawOpen', 'mouthSmileLeft', 'mouthSmileRight', 'mouthFunnel', 'mouthPucker', 'mouthLowerDownLeft', 'mouthUpperUpLeft', 'eyeBlinkLeft', 'eyeBlinkRight', 'browInnerUp', 'cheekPuff', 'jawForward'];
    keys.forEach(k => updateBlendshapeItem(k, 0));
    DOM.currentVisemeId.textContent = 'Viseme: 0 (Sil)';
  }

  /* ==========================================================================
     UI Chat Feed & Formatting
     ========================================================================== */

  function addUserMessage(text) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = 'msg-' + Date.now();

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble user';
    bubble.id = msgId;
    bubble.innerHTML = `
      <div class="msg-avatar">U</div>
      <div class="msg-content-box">
        <div class="msg-header">
          <span class="msg-author">${escapeHtml(state.speakerName || 'User')}</span>
          <span class="msg-time">${timeStr}</span>
        </div>
        <div class="msg-text">${escapeHtml(text)}</div>
      </div>
    `;

    DOM.chatMessages.appendChild(bubble);
    scrollToBottom(DOM.chatMessages);
    updateChatCount();
  }

  function startAiMessage() {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    state.currentAiBubbleId = 'msg-' + Date.now();
    state.currentAiText = '';

    const char = CHARACTERS[state.activeCharacter];
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble ai';
    bubble.id = state.currentAiBubbleId;
    bubble.innerHTML = `
      <div class="msg-avatar" style="background-image: url('${char.avatar}')"></div>
      <div class="msg-content-box">
        <div class="msg-header">
          <span class="msg-author">${escapeHtml(char.name.split(' ')[0])}</span>
          <span class="msg-time">${timeStr}</span>
        </div>
        <div class="msg-text" id="${state.currentAiBubbleId}-text">...</div>
        <div class="msg-actions">
          <button class="msg-btn-action" onclick="window.copyMsg('${state.currentAiBubbleId}')" title="Copy text">📋 Copy</button>
          <button class="msg-btn-action" onclick="window.rateFeedback('${state.currentAiBubbleId}', true)" title="Helpful">👍</button>
          <button class="msg-btn-action" onclick="window.rateFeedback('${state.currentAiBubbleId}', false)" title="Not helpful">👎</button>
        </div>
      </div>
    `;

    DOM.chatMessages.appendChild(bubble);
    scrollToBottom(DOM.chatMessages);
    updateChatCount();
  }

  function appendAiTextChunk(chunk) {
    if (!state.currentAiBubbleId) {
      startAiMessage();
    }
    state.currentAiText += chunk;
    const textEl = document.getElementById(`${state.currentAiBubbleId}-text`);
    if (textEl) {
      textEl.textContent = state.currentAiText;
    }
    scrollToBottom(DOM.chatMessages);
  }

  function finalizeAiMessage() {
    state.currentAiBubbleId = null;
    state.currentAiText = '';
  }

  function updateChatCount() {
    const count = DOM.chatMessages.querySelectorAll('.message-bubble').length;
    DOM.chatCountBadge.textContent = count;
  }

  /* ==========================================================================
     Canvas Audio Visualizer
     ========================================================================== */

  function setupCanvasVisualizer() {
    const canvas = DOM.audioVisualizerCanvas;
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 80;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Audio animation loop
    function drawVisualizer() {
      requestAnimationFrame(drawVisualizer);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 36;
      const barWidth = canvas.width / numBars - 4;
      const centerY = canvas.height;

      const isLive = state.isSpeaking || state.isRecording;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (isLive) {
          const wave = Math.sin((Date.now() / 120) + (i * 0.3)) * 0.5 + 0.5;
          const noise = Math.random() * 0.3;
          barHeight = Math.max(6, (wave + noise) * (canvas.height * 0.75));
        }

        const x = i * (barWidth + 4) + 4;
        const y = centerY - barHeight;

        // Gradient
        const grad = ctx.createLinearGradient(0, y, 0, centerY);
        if (state.isRecording) {
          grad.addColorStop(0, '#10b981');
          grad.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
        } else {
          grad.addColorStop(0, '#00f0ff');
          grad.addColorStop(0.6, '#a855f7');
          grad.addColorStop(1, 'rgba(168, 85, 247, 0.05)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();
      }
    }

    drawVisualizer();
  }

  /* ==========================================================================
     Audio Capture & VU Meter
     ========================================================================== */

  async function startMicAudioCapture() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(state.micStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function updateVU() {
        if (!state.isRecording) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const pct = Math.min(100, Math.round((avg / 128) * 100));
        DOM.micVuBar.style.width = pct + '%';
        requestAnimationFrame(updateVU);
      }

      updateVU();
    } catch (e) {
      console.warn('Microphone stream access notice:', e);
    }
  }

  function stopMicAudioCapture() {
    if (state.micStream) {
      state.micStream.getTracks().forEach(t => t.stop());
      state.micStream = null;
    }
    DOM.micVuBar.style.width = '0%';
  }

  function startRecTimer() {
    state.recStartTime = Date.now();
    state.recInterval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - state.recStartTime) / 1000);
      const m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const s = String(elapsedSec % 60).padStart(2, '0');
      DOM.recTimer.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopRecTimer() {
    clearInterval(state.recInterval);
    DOM.recTimer.textContent = '00:00';
  }

  /* ==========================================================================
     ARKit Blendshape & Visemes Telemetry
     ========================================================================== */

  function updateBlendshapeItem(shapeName, value) {
    const clamped = Math.min(1, Math.max(0, value));
    const valEl = document.getElementById(`val-${shapeName}`);
    const barEl = document.getElementById(`bar-${shapeName}`);
    if (valEl) valEl.textContent = clamped.toFixed(2);
    if (barEl) barEl.style.width = (clamped * 100).toFixed(1) + '%';
  }

  function updateBlendshapesUI(blendshapes) {
    if (!blendshapes) return;
    try {
      const bsObj = (typeof blendshapes.toObject === 'function') ? blendshapes.toObject() : blendshapes;
      const arkit = bsObj.arKitBlendShapes || bsObj;

      for (const [key, val] of Object.entries(arkit)) {
        updateBlendshapeItem(key, typeof val === 'number' ? val : parseFloat(val) || 0);
      }
    } catch (e) {
      console.warn('Error parsing blendshapes:', e);
    }
  }

  function updateVisemeUI(visemeData) {
    if (!visemeData) return;
    try {
      const visemeId = typeof visemeData.getVisemeId === 'function' ? visemeData.getVisemeId() : (visemeData.visemeId || 0);
      const visemeName = VISEME_MAP[visemeId] || `Viseme ${visemeId}`;
      DOM.currentVisemeId.textContent = `Viseme: ${visemeId} (${visemeName})`;
    } catch (e) {
      console.warn('Error parsing viseme:', e);
    }
  }

  /* ==========================================================================
     Narrative Triggers
     ========================================================================== */

  function dispatchTrigger(name, message) {
    if (!name) return;
    addLog('stream', `Invoking Trigger: [${name}] - "${message || ''}"`);

    const item = document.createElement('div');
    item.className = 'history-item';
    item.textContent = `[${new Date().toLocaleTimeString()}] Trigger dispatched: "${name}" (${message || 'No payload'})`;
    
    const emptyEl = DOM.triggerHistory.querySelector('.empty');
    if (emptyEl) emptyEl.remove();
    DOM.triggerHistory.prepend(item);

    if (state.mode === 'live' && state.client) {
      try {
        state.client.invokeTrigger(name, message || null);
      } catch (err) {
        addLog('error', `Trigger error: ${err.message}`);
      }
    } else {
      runSimulatedAIResponse(`Trigger invoked: ${name}`);
    }
  }

  /* ==========================================================================
     Event Log Console
     ========================================================================== */

  function addLog(type, msg) {
    const time = new Date().toLocaleTimeString();
    const row = document.createElement('div');
    row.className = `log-row ${type}`;
    row.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${escapeHtml(msg)}</span>`;
    
    DOM.logsStream.appendChild(row);
    scrollToBottom(DOM.logsStream);

    const count = DOM.logsStream.querySelectorAll('.log-row').length;
    DOM.logCount.textContent = `${count} events`;
  }

  /* ==========================================================================
     UI State Helpers
     ========================================================================== */

  function setAIStatus(statusText, statusClass) {
    DOM.aiStatusText.textContent = statusText;
    DOM.connectionStatusText.textContent = statusText;
  }

  function updateSubtitles(text) {
    DOM.subtitlesText.textContent = text;
  }

  function setAppMode(mode) {
    state.mode = mode;
    if (mode === 'live') {
      DOM.modeLiveBtn.classList.add('active');
      DOM.modeSimBtn.classList.remove('active');
      DOM.connectionStatusText.textContent = 'Live gRPC Active';
      addLog('info', 'Switched to Live Convai API mode.');
      initConvaiClient();
    } else {
      DOM.modeSimBtn.classList.add('active');
      DOM.modeLiveBtn.classList.remove('active');
      DOM.connectionStatusText.textContent = 'Simulation Sandbox';
      addLog('info', 'Switched to Interactive Simulation mode.');
    }
  }

  function updateConfigBadge() {
    if (state.apiKey && state.characterId) {
      DOM.configDot.style.background = 'var(--accent-emerald)';
      DOM.configDot.title = 'Configured';
    } else {
      DOM.configDot.style.background = 'var(--accent-amber)';
      DOM.configDot.title = 'No API key set';
    }
  }

  function loadStoredConfig() {
    DOM.cfgApiKey.value = state.apiKey;
    DOM.cfgCharacterId.value = state.characterId;
    DOM.cfgSessionId.value = state.sessionId;
    DOM.cfgSpeakerName.value = state.speakerName;
    DOM.cfgLanguage.value = state.languageCode;
    DOM.cfgFaceModel.value = state.faceModel;
    DOM.cfgEnableAudio.checked = state.enableAudio;
    DOM.cfgEnableFacialData.checked = state.enableFacialData;
    DOM.cfgMicUsage.checked = state.micUsage;
    DOM.cfgTextOnly.checked = state.textOnlyResponse;
  }

  function saveConfigFromModal() {
    state.apiKey = DOM.cfgApiKey.value.trim();
    state.characterId = DOM.cfgCharacterId.value.trim();
    state.sessionId = DOM.cfgSessionId.value.trim() || '-1';
    state.speakerName = DOM.cfgSpeakerName.value.trim() || 'User';
    state.languageCode = DOM.cfgLanguage.value;
    state.faceModel = parseInt(DOM.cfgFaceModel.value, 10);
    state.enableAudio = DOM.cfgEnableAudio.checked;
    state.enableFacialData = DOM.cfgEnableFacialData.checked;
    state.micUsage = DOM.cfgMicUsage.checked;
    state.textOnlyResponse = DOM.cfgTextOnly.checked;

    localStorage.setItem('convai_api_key', state.apiKey);
    localStorage.setItem('convai_character_id', state.characterId);
    localStorage.setItem('convai_session_id', state.sessionId);
    localStorage.setItem('convai_speaker_name', state.speakerName);
    localStorage.setItem('convai_language', state.languageCode);
    localStorage.setItem('convai_face_model', state.faceModel);
    localStorage.setItem('convai_enable_audio', state.enableAudio);
    localStorage.setItem('convai_enable_facial', state.enableFacialData);
    localStorage.setItem('convai_mic_usage', state.micUsage);
    localStorage.setItem('convai_text_only', state.textOnlyResponse);

    updateConfigBadge();
    DOM.configModal.classList.remove('active');
    addLog('success', 'Configuration updated and saved.');

    if (state.apiKey && state.characterId) {
      setAppMode('live');
    }
  }

  /* ==========================================================================
     Event Listeners
     ========================================================================== */

  function setupEventListeners() {
    // Mode Buttons
    DOM.modeSimBtn.addEventListener('click', () => setAppMode('simulation'));
    DOM.modeLiveBtn.addEventListener('click', () => {
      if (!state.apiKey || !state.characterId) {
        DOM.configModal.classList.add('active');
      }
      setAppMode('live');
    });

    // Settings Modal
    DOM.openSettingsBtn.addEventListener('click', () => DOM.configModal.classList.add('active'));
    DOM.closeSettingsBtn.addEventListener('click', () => DOM.configModal.classList.remove('active'));
    DOM.saveCredentialsBtn.addEventListener('click', saveConfigFromModal);
    DOM.clearCredentialsBtn.addEventListener('click', () => {
      localStorage.clear();
      state.apiKey = '';
      state.characterId = '';
      loadStoredConfig();
      updateConfigBadge();
      setAppMode('simulation');
      addLog('warn', 'Saved credentials cleared.');
    });

    DOM.toggleApiKeyVis.addEventListener('click', () => {
      DOM.cfgApiKey.type = DOM.cfgApiKey.type === 'password' ? 'text' : 'password';
    });

    // Reset Session
    DOM.resetSessionBtn.addEventListener('click', () => {
      state.sessionId = '-1';
      DOM.cfgSessionId.value = '-1';
      localStorage.setItem('convai_session_id', '-1');
      DOM.chatMessages.innerHTML = `
        <div class="system-notification">
          <div class="sys-dot"></div>
          <span>Session reset. Ready for new interaction.</span>
        </div>
      `;
      updateChatCount();
      resetBlendshapes();
      updateSubtitles("Session reset. How can I help you?");
      if (state.client) {
        state.client.resetSession();
      }
      addLog('info', 'Session reset to -1.');
    });

    // Volume & Mute
    DOM.volumeSlider.addEventListener('input', (e) => {
      state.audioVolume = parseFloat(e.target.value);
      if (state.client && typeof state.client.toggleAudioVolume === 'function') {
        // Convai client audio control
      }
    });

    DOM.toggleMuteBtn.addEventListener('click', () => {
      if (state.audioVolume > 0) {
        state.audioVolume = 0;
        DOM.volumeSlider.value = 0;
        DOM.volumeIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
      } else {
        state.audioVolume = 1;
        DOM.volumeSlider.value = 1;
        DOM.volumeIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/>`;
      }
    });

    // Character Switcher
    DOM.characterPresetSelect.addEventListener('change', (e) => {
      state.activeCharacter = e.target.value;
      const char = CHARACTERS[state.activeCharacter];
      DOM.charNameDisplay.textContent = char.name;
      DOM.charRoleDisplay.textContent = char.role;
      DOM.avatarImage.src = char.avatar;
      DOM.miniAvatar.style.backgroundImage = `url('${char.avatar}')`;
      addLog('info', `Switched active avatar preset to: ${char.name}`);
    });

    // Microphone Press / Toggle
    DOM.mainMicBtn.addEventListener('mousedown', startRecordingAudio);
    DOM.mainMicBtn.addEventListener('mouseup', stopRecordingAudio);
    DOM.mainMicBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecordingAudio(); });
    DOM.mainMicBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecordingAudio(); });

    DOM.inlineMicBtn.addEventListener('click', () => {
      if (state.isRecording) stopRecordingAudio();
      else startRecordingAudio();
    });

    // Audio Controls
    DOM.stopAudioBtn.addEventListener('click', () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (state.client) state.client.stopCharacterAudio();
      state.isSpeaking = false;
      setAIStatus('IDLE', 'idle');
      DOM.avatarFrame.classList.remove('speaking');
      resetBlendshapes();
      addLog('info', 'Character audio playback stopped.');
    });

    DOM.pauseResumeBtn.addEventListener('click', () => {
      if (!state.isSpeaking) return;
      if (state.isPaused) {
        if ('speechSynthesis' in window) window.speechSynthesis.resume();
        if (state.client) state.client.resumeAudio();
        state.isPaused = false;
        DOM.pauseResumeLabel.textContent = 'Pause';
      } else {
        if ('speechSynthesis' in window) window.speechSynthesis.pause();
        if (state.client) state.client.pauseAudio();
        state.isPaused = true;
        DOM.pauseResumeLabel.textContent = 'Resume';
      }
    });

    // Chat Form Submit
    DOM.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendUserQuery(DOM.chatInput.value);
    });

    // Quick Prompt Chips
    document.querySelectorAll('.prompt-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        sendUserQuery(prompt);
      });
    });

    // Tab Navigation
    DOM.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        DOM.tabBtns.forEach(b => b.classList.remove('active'));
        DOM.tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetPane = document.getElementById(`pane-${tab}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Triggers
    DOM.sendTriggerBtn.addEventListener('click', () => {
      const name = DOM.triggerNameInput.value.trim();
      const msg = DOM.triggerMessageInput.value.trim();
      dispatchTrigger(name, msg);
    });

    document.querySelectorAll('.quick-trigger-buttons button').forEach(btn => {
      btn.addEventListener('click', () => {
        const tname = btn.getAttribute('data-tname');
        const tmsg = btn.getAttribute('data-tmsg');
        DOM.triggerNameInput.value = tname;
        DOM.triggerMessageInput.value = tmsg;
        dispatchTrigger(tname, tmsg);
      });
    });

    // Clear Logs
    DOM.clearLogsBtn.addEventListener('click', () => {
      DOM.logsStream.innerHTML = '';
      DOM.logCount.textContent = '0 events';
    });
  }

  /* ==========================================================================
     Global Utility Functions
     ========================================================================== */

  window.copyMsg = function(msgId) {
    const textEl = document.getElementById(`${msgId}-text`);
    if (textEl) {
      navigator.clipboard.writeText(textEl.textContent);
      addLog('info', 'Copied message to clipboard.');
    }
  };

  window.rateFeedback = function(msgId, thumbsUp) {
    addLog('info', `User feedback recorded: ${thumbsUp ? '👍 Thumbs Up' : '👎 Thumbs Down'}`);
    if (state.client) {
      try {
        state.client.sendFeedback('interaction_' + Date.now(), state.characterId, state.sessionId, thumbsUp, thumbsUp ? 'Positive' : 'Negative');
      } catch (e) {
        console.warn('Feedback send error:', e);
      }
    }
  };

  function scrollToBottom(element) {
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Kickstart Application
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
