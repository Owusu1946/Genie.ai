export const DEFAULT_CHAT_MODEL: string = 'chat-model';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Genie-01',
    description: 'Primary model for all-purpose chat',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Genie-Reasoning',
    description: 'Uses advanced reasoning',
  },
];
