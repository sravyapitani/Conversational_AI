export interface ActionConfigParamsType {
    actions?: string[];
    characters?: any[];
    objects?: any[];
    classification?: string;
    contextLevel?: number;
    currentAttentionObject?: string;
}
export interface ConvaiGRPCClientConfigType {
    apiKey: string;
    characterId: string;
    speaker: string;
    speakerId: string;
    sessionId: string;
    errorCallback: (type: string, statusMessage: string, status: string) => void;
    responseCallback: (response: any) => void;
    languageCode: string;
    disableAudioGeneration: boolean;
    enableFacialData: boolean;
    faceModel: 0 | 1 | 2 | 3;
    narrativeTemplateKeysMap: any;
    actionConfig?: ActionConfigParamsType | null;
}
export interface ConvaiClientParams {
    apiKey: string;
    characterId: string;
    speaker?: string;
    enableAudio: boolean;
    speakerId?: string;
    sessionId: string;
    languageCode?: string;
    enableFacialData?: boolean;
    faceModel?: 0 | 1 | 2 | 3;
    narrativeTemplateKeysMap?: Map<string, string>;
    textOnlyResponse?: boolean;
    micUsage?: boolean;
}
export declare class ConvaiClient {
    convaiConfig: ConvaiGRPCClientConfigType;
    constructor(params: ConvaiClientParams);
    resetSession(): void;
    setResponseCallback(fn: (response: any) => void): void;
    setErrorCallback(fn: (type: string, statusMessage: string, status: string) => void): void;
    sendTextChunk(text: string): void;
    startAudioChunk(): void;
    invokeTrigger(name: string | null, message?: string | null, preload?: boolean): void;
    sendFeedback(interaction_id: string, character_id: string, session_id: string, thumbs_up: boolean, feedback_text: string): void;
    endAudioChunk(): void;
    toggleAudioVolume(): void;
    getAudioVolume(): number;
    stopCharacterAudio(): void;
    onAudioPlay(fn: () => void): void;
    onAudioStop(fn: () => void): void;
    pauseAudio(): void;
    resumeAudio(): void;
    onAudioStateChange(fn: () => void): void;
    playAudio(): void;
    setActionConfig(actionConfig: ActionConfigParamsType): void;
}
export declare const narrativeDesign: {
    createSection: (params: any) => Promise<void>;
    editSection: (params: any) => Promise<void>;
    getSection: (params: any) => Promise<void>;
    listSections: (params: any) => Promise<void>;
    deleteSection: (params: any) => Promise<void>;
    createTrigger: (params: any) => Promise<void>;
    updateTrigger: (params: any) => Promise<void>;
    deleteTrigger: (params: any) => Promise<void>;
    getTrigger: (params: any) => Promise<void>;
    listTriggers: (params: any) => Promise<void>;
};
export default ConvaiClient;
