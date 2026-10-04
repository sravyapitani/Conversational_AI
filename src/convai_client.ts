/**
 * Convai Web SDK - Client Definitions
 */

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

export class ConvaiClient {
  public convaiConfig: ConvaiGRPCClientConfigType;

  constructor(params: ConvaiClientParams) {
    this.convaiConfig = {
      apiKey: params.apiKey,
      characterId: params.characterId,
      speaker: params.speaker || 'User',
      speakerId: params.speakerId || 'user_1',
      sessionId: params.sessionId || '-1',
      errorCallback: () => {},
      responseCallback: () => {},
      languageCode: params.languageCode || 'en-US',
      disableAudioGeneration: !!params.textOnlyResponse,
      enableFacialData: !!params.enableFacialData,
      faceModel: params.faceModel || 3,
      narrativeTemplateKeysMap: params.narrativeTemplateKeysMap || new Map(),
      actionConfig: null
    };
  }

  public resetSession(): void {}
  public setResponseCallback(fn: (response: any) => void): void {}
  public setErrorCallback(fn: (type: string, statusMessage: string, status: string) => void): void {}
  public sendTextChunk(text: string): void {}
  public startAudioChunk(): void {}
  public invokeTrigger(name: string | null, message?: string | null, preload?: boolean): void {}
  public sendFeedback(interaction_id: string, character_id: string, session_id: string, thumbs_up: boolean, feedback_text: string): void {}
  public endAudioChunk(): void {}
  public toggleAudioVolume(): void {}
  public getAudioVolume(): number { return 1; }
  public stopCharacterAudio(): void {}
  public onAudioPlay(fn: () => void): void {}
  public onAudioStop(fn: () => void): void {}
  public pauseAudio(): void {}
  public resumeAudio(): void {}
  public onAudioStateChange(fn: () => void): void {}
  public playAudio(): void {}
  public setActionConfig(actionConfig: ActionConfigParamsType): void {}
}

export const narrativeDesign = {
  createSection: async (params: any) => {},
  editSection: async (params: any) => {},
  getSection: async (params: any) => {},
  listSections: async (params: any) => {},
  deleteSection: async (params: any) => {},
  createTrigger: async (params: any) => {},
  updateTrigger: async (params: any) => {},
  deleteTrigger: async (params: any) => {},
  getTrigger: async (params: any) => {},
  listTriggers: async (params: any) => {}
};

export default ConvaiClient;
