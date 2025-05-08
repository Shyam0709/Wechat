import '../../styles/CometChatDetails/CometChatThreadedMessages.css';
import {
  CometChatMessageComposer,
  CometChatMessageList,
  CometChatThreadHeader,
  CometChatUserEvents,
  getLocalizedString,
} from '@cometchat/chat-uikit-react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import React from 'react';
import { CallLog } from '@cometchat/calls-sdk-javascript';
import { useBuilderSettingContext } from '../../context/BuilderSettingsContext';
interface ThreadProps {
  message: CometChat.BaseMessage;
  requestBuilderState?: CometChat.MessagesRequestBuilder;
  selectedItem: CometChat.User | CometChat.Group | CometChat.Conversation | CometChat.Call | CallLog | undefined;
  onClose?: () => void;
  showComposer?: boolean;
}

export const CometChatThreadedMessages = (props: ThreadProps) => {
  const { message, requestBuilderState, selectedItem, onClose = () => {}, showComposer = false } = props;
  const { chatFeatures } = useBuilderSettingContext();
  return (
    <div className="cometchat-threaded-message">
      <div className="cometchat-threaded-message-header">
        <CometChatThreadHeader parentMessage={message} onClose={onClose} />
      </div>
      {requestBuilderState?.parentMessageId === message.getId() && (
        <>
          <div className="cometchat-threaded-message-list" key="threaded-message-list-wrapper">
            <CometChatMessageList
              key="threaded-message-list-content"
              parentMessageId={message.getId()}
              user={
                (selectedItem as CometChat.Conversation)?.getConversationType?.() === 'user'
                  ? ((selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.User)
                  : (selectedItem as CometChat.User).getUid?.()
                    ? (selectedItem as CometChat.User)
                    : undefined
              }
              group={
                (selectedItem as CometChat.Conversation)?.getConversationType?.() === 'group'
                  ? ((selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.Group)
                  : (selectedItem as CometChat.Group).getGuid?.()
                    ? (selectedItem as CometChat.Group)
                    : undefined
              }
              messagesRequestBuilder={requestBuilderState}
              hideReplyInThreadOption={
                chatFeatures && !chatFeatures?.coreMessagingExperience?.threadConversationAndReplies
              }
              hideTranslateMessageOption={chatFeatures && !chatFeatures?.deeperUserEngagement?.messageTranslation}
              hideEditMessageOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.editMessage}
              hideDeleteMessageOption={chatFeatures && !chatFeatures?.coreMessagingExperience?.deleteMessage}
              hideReactionOption={chatFeatures && !chatFeatures?.deeperUserEngagement?.reactions}
              hideMessagePrivatelyOption={
                chatFeatures && !chatFeatures?.privateMessagingWithinGroups?.sendPrivateMessageToGroupMembers
              }
              hideReceipts={chatFeatures && !chatFeatures?.coreMessagingExperience?.messageDeliveryAndReadReceipts}
              hideMessageInfoOption={
                chatFeatures && !chatFeatures?.coreMessagingExperience?.messageDeliveryAndReadReceipts
              }
            />
          </div>
          {showComposer ? (
            <div className="cometchat-threaded-message-composer">
              <CometChatMessageComposer
                parentMessageId={message.getId()}
                user={
                  (selectedItem as CometChat.Conversation)?.getConversationType?.() === 'user'
                    ? ((selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.User)
                    : (selectedItem as CometChat.User).getUid?.()
                      ? (selectedItem as CometChat.User)
                      : undefined
                }
                group={
                  (selectedItem as CometChat.Conversation)?.getConversationType?.() === 'group'
                    ? ((selectedItem as CometChat.Conversation)?.getConversationWith() as CometChat.Group)
                    : (selectedItem as CometChat.Group).getGuid?.()
                      ? (selectedItem as CometChat.Group)
                      : undefined
                }
                disableMentions={!chatFeatures?.deeperUserEngagement?.mentions}
                disableTypingEvents={chatFeatures && !chatFeatures?.coreMessagingExperience?.typingIndicator}
                hidePollsOption={chatFeatures && !chatFeatures?.deeperUserEngagement?.polls}
                hideCollaborativeDocumentOption={
                  chatFeatures && !chatFeatures?.deeperUserEngagement?.collaborativeDocument
                }
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
                let user: CometChat.User | null = null;

                if (selectedItem instanceof CometChat.User) {
                  user = selectedItem;
                } else if (
                  selectedItem instanceof CometChat.Conversation &&
                  selectedItem.getConversationType() === CometChat.RECEIVER_TYPE.USER &&
                  selectedItem.getConversationWith() instanceof CometChat.User
                ) {
                  user = selectedItem.getConversationWith() as CometChat.User;
                }
                if (user) {
                  CometChat.unblockUsers([user.getUid()]).then(() => {
                    user?.setBlockedByMe(false);
                    CometChatUserEvents.ccUserUnblocked.next(user as CometChat.User);
                  });
                }
              }}
            >
              <div className="message-composer-blocked__text">
                {getLocalizedString('cannot_send_to_blocked_user')}{' '}
                <span className="message-composer-blocked__text-unblock">
                  {' '}
                  {getLocalizedString('click_to_unblock')}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
