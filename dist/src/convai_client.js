export class ConvaiClient {
    constructor(params) {
        this.convaiConfig = {
            apiKey: params.apiKey,
            characterId: params.characterId,
            speaker: params.speaker || 'User',
            speakerId: params.speakerId || 'user_1',
            sessionId: params.sessionId || '-1',
            errorCallback: () => { },
            responseCallback: () => { },
            languageCode: params.languageCode || 'en-US',
            disableAudioGeneration: !!params.textOnlyResponse,
            enableFacialData: !!params.enableFacialData,
            faceModel: params.faceModel || 3,
            narrativeTemplateKeysMap: params.narrativeTemplateKeysMap || new Map(),
            actionConfig: null
        };
    }
    resetSession() { }
    setResponseCallback(fn) { }
    setErrorCallback(fn) { }
    sendTextChunk(text) { }
    startAudioChunk() { }
    invokeTrigger(name, message, preload) { }
    sendFeedback(interaction_id, character_id, session_id, thumbs_up, feedback_text) { }
    endAudioChunk() { }
    toggleAudioVolume() { }
    getAudioVolume() { return 1; }
    stopCharacterAudio() { }
    onAudioPlay(fn) { }
    onAudioStop(fn) { }
    pauseAudio() { }
    resumeAudio() { }
    onAudioStateChange(fn) { }
    playAudio() { }
    setActionConfig(actionConfig) { }
}
export const narrativeDesign = {
    createSection: async (params) => { },
    editSection: async (params) => { },
    getSection: async (params) => { },
    listSections: async (params) => { },
    deleteSection: async (params) => { },
    createTrigger: async (params) => { },
    updateTrigger: async (params) => { },
    deleteTrigger: async (params) => { },
    getTrigger: async (params) => { },
    listTriggers: async (params) => { }
};
export default ConvaiClient;
//# sourceMappingURL=convai_client.js.map