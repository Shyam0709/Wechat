/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import '../../styles/CometChatCallLog/CometChatCallLogDetails.css';
import { CometChat, User } from '@cometchat/chat-sdk-javascript';
import { CometChatCallDetailsInfo } from './CometChatCallLogInfo';
import { CometChatCallDetailsParticipants } from './CometChatCallLogParticipants';
import { CometChatCallDetailsRecording } from './CometChatCallLogRecordings';
import { CometChatCallDetailsHistory } from './CometChatCallLogHistory';
import {
  CometChatCallButtons,
  CometChatListItem,
  CometChatUIKitConstants,
  CometChatUIKitLoginListener,
  getLocalizedString,
  MessageUtils,
} from '@cometchat/chat-uikit-react';
import { useBuilderSettingContext } from '../../context/BuilderSettingsContext';

export const CometChatCallDetails = (props: { selectedItem: any; onBack?: () => void }) => {
  const { selectedItem, onBack } = props;
  const callDetailTabItems = [
    getLocalizedString('participants'),
    getLocalizedString('recording'),
    getLocalizedString('history'),
  ];
  const [activeTab, setActiveTab] = useState('Participants');
  const [user, setUser] = useState<User>();
  const [subtitleText, setSubtitleText] = useState<string>();
  const { callFeatures, chatFeatures } = useBuilderSettingContext();

  function verifyCallUser(call: any, loggedInUser: CometChat.User) {
    if (call.getInitiator().getUid() === loggedInUser.getUid()) {
      return call.getReceiver();
    } else {
      return call.getInitiator();
    }
  }
  useEffect(() => {
    const isBlocked = new MessageUtils().getUserStatusVisible(user);
    const userListenerId = 'users_custom' + Date.now();
    if (isBlocked) {
      setSubtitleText('');
      return;
    }
    setSubtitleText(user?.getStatus());
    CometChat.addUserListener(
      userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          if (user?.getUid() === onlineUser.getUid()) {
            setSubtitleText(onlineUser?.getStatus());
          }
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          if (user?.getUid() === offlineUser?.getUid()) {
            setSubtitleText(offlineUser?.getStatus());
          }
        },
      })
    );
    return () => {
      CometChat.removeUserListener(userListenerId);
    };
  }, [user]);

  useEffect(() => {
    const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
    const callUser = verifyCallUser(selectedItem, loggedInUser!);
    if (selectedItem.receiverType === CometChatUIKitConstants.MessageReceiverType.user) {
      CometChat.getUser(callUser.uid).then((response: User) => {
        setUser(response);
      });
    }
  }, [selectedItem]);

  const getSubtitleView = useCallback(() => {
    return (
      <div className={`cometchat-call-log-details__subtitle`}>
        {chatFeatures && chatFeatures?.coreMessagingExperience?.userAndFriendsPresence ? subtitleText : ''}
      </div>
    );
  }, [subtitleText, chatFeatures]);

  function getTrailingView() {
    return (
      <div className={`cometchat-call-log-details__trailing-view`}>
        <CometChatCallButtons
          user={user!}
          key={'callbuttonsVCBSampleApp'}
          hideVideoCallButton={!callFeatures?.voiceAndVideoCalling?.oneOnOneVideoCalling}
          hideVoiceCallButton={!callFeatures?.voiceAndVideoCalling?.oneOnOneVoiceCalling}
        />
      </div>
    );
  }

  return (
    <div className="cometchat-call-log-details">
      <div className="cometchat-call-log-details__header">
        <div className="cometchat-call-log-details__header-back" onClick={onBack} />
        {getLocalizedString('call_details')}
      </div>
      <div className="cometchat-call-log-details__call-log-item">
        <CometChatListItem
          avatarName={user?.getName()}
          avatarURL={user?.getAvatar()}
          title={user?.getName() || ''}
          subtitleView={getSubtitleView()}
          trailingView={getTrailingView()}
        />
      </div>
      <CometChatCallDetailsInfo call={selectedItem} />
      <div className="cometchat-call-log-details__tabs">
        {callDetailTabItems.map((tabItem, index) => (
          <div
            key={tabItem + index}
            onClick={() => setActiveTab(tabItem)}
            className={
              activeTab === tabItem
                ? 'cometchat-call-log-details__tabs-tab-item-active'
                : 'cometchat-call-log-details__tabs-tab-item'
            }
          >
            {tabItem}
          </div>
        ))}
      </div>

      <>
        {activeTab === 'Participants' ? (
          <CometChatCallDetailsParticipants call={selectedItem} />
        ) : activeTab === 'Recording' ? (
          <CometChatCallDetailsRecording call={selectedItem} />
        ) : activeTab === 'History' ? (
          <CometChatCallDetailsHistory call={selectedItem} />
        ) : null}
      </>
    </div>
  );
};
