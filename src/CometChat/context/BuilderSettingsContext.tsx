import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { BuilderSetting } from '../builderSettings';

interface BuilderSettingContextType {
  chatFeatures: BuilderSettingType['chatFeatures'];
  callFeatures: BuilderSettingType['callFeatures'];
  styleFeatures: BuilderSettingType['style'];
  layoutFeatures: BuilderSettingType['layout'];
  setChatFeatures: React.Dispatch<React.SetStateAction<BuilderSettingType['chatFeatures']>>;
  setCallFeatures: React.Dispatch<React.SetStateAction<BuilderSettingType['callFeatures']>>;
  setStyleFeatures: React.Dispatch<React.SetStateAction<BuilderSettingType['style']>>;
  setLayoutFeatures: React.Dispatch<React.SetStateAction<BuilderSettingType['layout']>>;
}

interface BuilderSettingsProviderProps {
  children: ReactNode;
  authBuilderSetting?: BuilderSettingType;
}
const BuilderSettingContext = createContext<BuilderSettingContextType | undefined>(undefined);

export const BuilderSettingsProvider: React.FC<BuilderSettingsProviderProps> = ({ children, authBuilderSetting }) => {
  const [chatFeatures, setChatFeatures] = useState<BuilderSettingType['chatFeatures']>(BuilderSetting.chatFeatures);
  const [callFeatures, setCallFeatures] = useState<BuilderSettingType['callFeatures']>(BuilderSetting.callFeatures);
  const [styleFeatures, setStyleFeatures] = useState<BuilderSettingType['style']>(BuilderSetting.style);
  const [layoutFeatures, setLayoutFeatures] = useState<BuilderSettingType['layout']>(BuilderSetting.layout);
  useEffect(() => {
    if (authBuilderSetting) {
      const { chatFeatures, callFeatures, layout, style } = authBuilderSetting;
      setChatFeatures(chatFeatures);
      setCallFeatures(callFeatures);
      setStyleFeatures(style);
      setLayoutFeatures(layout);
    } else if (BuilderSetting) {
      const { chatFeatures, callFeatures, layout, style } = BuilderSetting;
      setChatFeatures(chatFeatures);
      setCallFeatures(callFeatures);
      setStyleFeatures(style);
      setLayoutFeatures(layout);
    }
  }, [authBuilderSetting]);

  return (
    <BuilderSettingContext.Provider
      value={{
        chatFeatures,
        callFeatures,
        styleFeatures,
        layoutFeatures,
        setChatFeatures,
        setCallFeatures,
        setStyleFeatures,
        setLayoutFeatures,
      }}
    >
      {children}
    </BuilderSettingContext.Provider>
  );
};

export const useBuilderSettingContext = () => {
  const context = useContext(BuilderSettingContext);
  if (!context) throw new Error('useBuilderSettingContext must be used within a BuilderSettingsProvider');
  return context;
};

export interface BuilderSettingType {
  chatFeatures: {
    coreMessagingExperience: {
      typingIndicator: boolean;
      threadConversationAndReplies: boolean;
      photosSharing: boolean;
      videoSharing: boolean;
      audioSharing: boolean;
      fileSharing: boolean;
      editMessage: boolean;
      deleteMessage: boolean;
      messageDeliveryAndReadReceipts: boolean;
      userAndFriendsPresence: boolean;
    };
    deeperUserEngagement: {
      mentions: boolean;
      reactions: boolean;
      messageTranslation: boolean;
      polls: boolean;
      collaborativeWhiteboard: boolean;
      collaborativeDocument: boolean;
      voiceNotes: boolean;
      emojis: boolean;
      stickers: boolean;
      userInfo: boolean;
      groupInfo: boolean;
    };
    aiUserCopilot: {
      conversationStarter: boolean;
      conversationSummary: boolean;
      smartReply: boolean;
    };

    groupManagement: {
      createGroup: boolean;
      addMembersToGroups: boolean;
      joinLeaveGroup: boolean;
      deleteGroup: boolean;
      viewGroupMembers: boolean;
    };
    moderatorControls: {
      kickUsers: boolean;
      banUsers: boolean;
      promoteDemoteMembers: boolean;
    };
    privateMessagingWithinGroups: {
      sendPrivateMessageToGroupMembers: boolean;
    };
  };
  callFeatures: {
    voiceAndVideoCalling: {
      oneOnOneVoiceCalling: boolean;
      oneOnOneVideoCalling: boolean;
      groupVideoConference: boolean;
      groupVoiceConference: boolean;
    };
  };
  layout: {
    withSideBar: boolean;
    tabs: string[];
    chatType: string;
  };
  style: {
    theme: string;
    color: {
      brandColor: string;
      primaryTextLight: string;
      primaryTextDark: string;
      secondaryTextLight: string;
      secondaryTextDark: string;
    };
    typography: {
      font: string;
      size: string;
    };
  };
}

// THIS IS FOR THE USER & PRODUCT IDENTIFICATION FOR RUNNABLE APP, DO NOT DELETE

interface CometChatVisualBuilderReact {
  name: string;
  version: string;
}

declare global {
  interface Window {
    CometChatVisualBuilderReact: CometChatVisualBuilderReact;
  }
}

if (typeof window !== 'undefined') {
  window.CometChatVisualBuilderReact = {
    name: 'cometchat-visual-builder-react',
    version: '1.0.2',
  };
}
