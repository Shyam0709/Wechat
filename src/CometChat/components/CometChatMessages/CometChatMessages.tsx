import {
  CometChatMessageComposer,
  CometChatMessageHeader,
  CometChatMessageList,
  getLocalizedString,
  CometChatUserEvents,
} from '@cometchat/chat-uikit-react';
import '../../styles/CometChatMessages/CometChatMessages.css';
import React, { JSX, useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useBuilderSettingContext } from '../../context/BuilderSettingsContext';
interface MessagesViewProps {
  user?: CometChat.User;
  group?: CometChat.Group;
  headerMenu: () => JSX.Element;
  onThreadRepliesClick: (message: CometChat.BaseMessage) => void;
  showComposer?: boolean;
  onBack?: () => void;
}

export const CometChatMessages = (props: MessagesViewProps) => {
  const { chatFeatures, callFeatures, layoutFeatures } = useBuilderSettingContext();

  const { user, group, headerMenu, onThreadRepliesClick, showComposer, onBack = () => {} } = props;

  const [showComposerState, setShowComposerState] = useState<boolean | undefined>(showComposer);

  useEffect(() => {
    setShowComposerState(showComposer);
    if (user?.getHasBlockedMe?.()) {
      setShowComposerState(false);
    }
  }, [user, showComposer]);

  const determineVideoCallVisibility = () => {
    if (group) {
      // Check group-specific video call permission
      return !callFeatures?.voiceAndVideoCalling?.groupVideoConference;
    } else if (user) {
      // Check one-on-one video call permission
      return !callFeatures?.voiceAndVideoCalling?.oneOnOneVideoCalling;
    }
    return true; // Default to hiding if neither user nor group
  };

  const determineVoiceCallVisibility = () => {
    if (group) {
      // Check group-specific voice call permission
      return !callFeatures?.voiceAndVideoCalling?.groupVoiceConference;
    } else if (user) {
      // Check one-on-one voice call permission
      return !callFeatures?.voiceAndVideoCalling?.oneOnOneVoiceCalling;
    }
    return true; // Default to hiding if neither user nor group
  };

  const determineUserOrGroupInfoVisibility = () => {
    if (group) {
      return chatFeatures && chatFeatures?.deeperUserEngagement?.groupInfo ? headerMenu() : <></>;
    } else if (user) {
      return chatFeatures && chatFeatures?.deeperUserEngagement?.userInfo ? headerMenu() : <></>;
    }
    return <></>; // Default to hiding if neither user nor group
  };

  return (
    <div className="cometchat-messages-wrapper">
      <div className="cometchat-header-wrapper">
        <CometChatMessageHeader
          user={user}
          group={group}
          auxiliaryButtonView={determineUserOrGroupInfoVisibility()}
          onBack={onBack}
          hideVideoCallButton={determineVideoCallVisibility()}
          hideVoiceCallButton={determineVoiceCallVisibility()}
          showConversationSummaryButton={chatFeatures && chatFeatures?.aiUserCopilot?.conversationSummary}
          hideUserStatus={chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence}
          hideBackButton={layoutFeatures && !layoutFeatures.withSideBar}
        />
      </div>
      <div className="cometchat-message-list-wrapper">
        <CometChatMessageList
          user={user}
          group={group}
          onThreadRepliesClick={(message: CometChat.BaseMessage) => onThreadRepliesClick(message)}
          showSmartReplies={chatFeatures && chatFeatures?.aiUserCopilot?.smartReply}
          showConversationStarters={chatFeatures && chatFeatures?.aiUserCopilot?.conversationStarter}
          smartRepliesDelayDuration={1000}
          hideReplyInThreadOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.threadConversationAndReplies}
          hideTranslateMessageOption={chatFeatures && !chatFeatures?.deeperUserEngagement?.messageTranslation}
          hideEditMessageOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.editMessage}
          hideDeleteMessageOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.deleteMessage}
          hideReactionOption={chatFeatures && !chatFeatures?.deeperUserEngagement?.reactions}
          hideMessagePrivatelyOption={
            chatFeatures && !chatFeatures?.privateMessagingWithinGroups?.sendPrivateMessageToGroupMembers
          }
          hideReceipts={chatFeatures && !chatFeatures?.coreMessagingExperience?.messageDeliveryAndReadReceipts}
          hideMessageInfoOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.messageDeliveryAndReadReceipts}
        />
      </div>
      {showComposerState ? (
        <div className="cometchat-composer-wrapper">
          <CometChatMessageComposer
            user={user}
            group={group}
            disableMentions={!chatFeatures?.deeperUserEngagement?.mentions}
            disableTypingEvents={chatFeatures && !chatFeatures?.coreMessagingExperience?.typingIndicator}
            hidePollsOption={chatFeatures && !chatFeatures?.deeperUserEngagement?.polls}
            hideCollaborativeDocumentOption={chatFeatures && !chatFeatures?.deeperUserEngagement?.collaborativeDocument}
            hideStickersButton={chatFeatures && !chatFeatures?.deeperUserEngagement?.stickers}
            hideEmojiKeyboardButton={chatFeatures && !chatFeatures?.deeperUserEngagement?.emojis}
            hideVoiceRecordingButton={chatFeatures && !chatFeatures?.deeperUserEngagement?.voiceNotes}
            hideCollaborativeWhiteboardOption={
              chatFeatures && !chatFeatures?.deeperUserEngagement?.collaborativeWhiteboard
            }
            hideVideoAttachmentOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.videoSharing}
            hideFileAttachmentOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.fileSharing}
            hideAudioAttachmentOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.audioSharing}
            hideImageAttachmentOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.photosSharing}
          />
        </div>
      ) : (
        <div
          className="message-composer-blocked"
          onClick={() => {
            if (user) {
              CometChat.unblockUsers([user?.getUid()]).then(() => {
                user.setBlockedByMe(false);
                CometChatUserEvents.ccUserUnblocked.next(user);
              });
            }
          }}
        >
          <div className="message-composer-blocked__text">
            {getLocalizedString('cannot_send_to_blocked_user')}{' '}
            <span className="message-composer-blocked__text-unblock"> {getLocalizedString('click_to_unblock')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
