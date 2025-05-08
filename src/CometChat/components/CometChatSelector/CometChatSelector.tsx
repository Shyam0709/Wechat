/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import chatIcon from '../../assets/start_chat.svg';
import createGroupIcon from '../../assets/create-group.svg';
import logoutIcon from '../../assets/logout.svg';
import userIcon from '../../assets/user.svg';
import { Call, Conversation, Group, User } from '@cometchat/chat-sdk-javascript';
import '../../styles/CometChatSelector/CometChatSelector.css';
import { CometChatJoinGroup } from '../CometChatJoinGroup/CometChatJoinGroup';
import CometChatCreateGroup from '../CometChatCreateGroup/CometChatCreateGroup';
import {
  CometChatButton,
  CometChatCallLogs,
  CometChatConversations,
  CometChatGroups,
  CometChatOption,
  CometChatUIKit,
  CometChatUIKitLoginListener,
  CometChatUsers,
  getLocalizedString,
  CometChatContextMenu,
  Placement,
} from '@cometchat/chat-uikit-react';
import { AppContext } from '../../context/AppContext';
import { useBuilderSettingContext } from '../../context/BuilderSettingsContext';
import { CallLog } from '@cometchat/calls-sdk-javascript';

interface SelectorProps {
  group?: Group;
  showJoinGroup?: boolean;
  activeTab?: string;
  activeItem?: User | Group | Conversation | Call | CallLog;
  onSelectorItemClicked?: (input: User | Group | Conversation | Call, type: string) => void;
  onProtectedGroupJoin?: (group: Group) => void;
  showCreateGroup?: boolean;
  setShowCreateGroup?: Dispatch<SetStateAction<boolean>>;
  onHide?: () => void;
  onNewChatClicked?: () => void;
  onGroupCreated?: (group: Group) => void;
  hideCreateGroupButton?: boolean;
}

const CometChatSelector = (props: SelectorProps) => {
  const {
    group,
    showJoinGroup,
    activeItem,
    activeTab,
    onSelectorItemClicked = () => {},
    onProtectedGroupJoin = () => {},
    showCreateGroup,
    setShowCreateGroup = () => {},
    onHide = () => {},
    onNewChatClicked = () => {},
    onGroupCreated = () => {},
    hideCreateGroupButton = true,
  } = props;

  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>();
  const { setAppState } = useContext(AppContext);
  const { chatFeatures, callFeatures } = useBuilderSettingContext();
  const getLoggedInUser = CometChatUIKitLoginListener.getLoggedInUser();

  useEffect(() => {
    setLoggedInUser(getLoggedInUser);
  }, [getLoggedInUser]);

  useEffect(() => {
    if (activeTab === 'calls') {
      const toggleCallIcons = () => {
        const voiceCallIcons = document.getElementsByClassName('cometchat-call-logs__list-item-trailing-view-audio');
        const videoCallIcons = document.getElementsByClassName('cometchat-call-logs__list-item-trailing-view-video');
        if (callFeatures.voiceAndVideoCalling.oneOnOneVoiceCalling) {
          Array.from(voiceCallIcons).forEach((icon: any) => {
            icon.style.display = '';
          });
        } else {
          Array.from(voiceCallIcons).forEach((icon: any) => {
            icon.style.display = 'none';
          });
        }

        if (callFeatures.voiceAndVideoCalling.oneOnOneVideoCalling) {
          Array.from(videoCallIcons).forEach((icon: any) => {
            icon.style.display = '';
          });
        } else {
          Array.from(videoCallIcons).forEach((icon: any) => {
            icon.style.display = 'none';
          });
        }
      };

      if (document.getElementsByClassName('cometchat-call-logs__list-item-trailing-view-audio').length === 0) {
        const interval = setInterval(() => {
          const targetElement = document.getElementsByClassName('cometchat-call-logs__list-item-trailing-view-audio');
          if (targetElement.length > 0) {
            clearInterval(interval);
            toggleCallIcons();
          }
        }, 1);

        return () => clearInterval(interval);
      } else {
        toggleCallIcons();
      }
    }
  }, [callFeatures, activeTab]);

  const getOptions = (): CometChatOption[] => {
    return [
      new CometChatOption({
        id: 'logged-in-user',
        title: (loggedInUser && loggedInUser.getName()) || '',
        iconURL: userIcon,
      }),
      new CometChatOption({
        id: 'create-conversation',
        title: getLocalizedString('create_conversation'),
        iconURL: chatIcon,
        onClick: () => {
          onNewChatClicked();
        },
      }),
      new CometChatOption({
        id: 'log-out',
        title: getLocalizedString('log_out'),
        iconURL: logoutIcon,
        onClick: () => {
          logOut();
        },
      }),
    ];
  };

  const logOut = () => {
    CometChatUIKit.logout()
      .then(() => {
        setLoggedInUser(null);
        setAppState({ type: 'resetAppState' });
      })
      .catch((error) => {
        console.error('error', error);
      });
  };

  const conversationsHeaderView = () => {
    return (
      <div className="cometchat-conversations-header">
        <div className="cometchat-conversations-header__title">{getLocalizedString('conversation_chat_title')}</div>
        <div className="chat-menu">
          <CometChatContextMenu
            key="delete-button"
            closeOnOutsideClick={true}
            placement={Placement.left}
            data={getOptions() as CometChatOption[]}
            topMenuSize={1}
            onOptionClicked={(e: CometChatOption) => {
              const { onClick } = e;
              if (onClick) {
                onClick();
              }
            }}
          />
        </div>
      </div>
    );
  };

  const groupsHeaderView = () => {
    return (
      <div className="cometchat-groups-header">
        <div className="cometchat-groups-header__title">{getLocalizedString('group_title')}</div>
        {!hideCreateGroupButton && (
          <CometChatButton
            onClick={() => {
              setShowCreateGroup(true);
            }}
            iconURL={createGroupIcon}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {loggedInUser && (
        <>
          {showJoinGroup && group && (
            <CometChatJoinGroup
              group={group}
              onHide={onHide}
              onProtectedGroupJoin={(group) => onProtectedGroupJoin(group)}
            />
          )}
          {activeTab === 'chats' ? (
            <CometChatConversations
              activeConversation={activeItem as Conversation}
              headerView={conversationsHeaderView()}
              onItemClick={(e) => {
                onSelectorItemClicked(e, 'updateSelectedItem');
              }}
              hideUserStatus={chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence}
              hideReceipts={chatFeatures && !chatFeatures?.coreMessagingExperience?.messageDeliveryAndReadReceipts}
            />
          ) : activeTab === 'calls' ? (
            <CometChatCallLogs
              activeCall={activeItem as Call}
              onItemClick={(e: Call) => {
                onSelectorItemClicked(e, 'updateSelectedItemCall');
              }}
            />
          ) : activeTab === 'users' ? (
            <CometChatUsers
              activeUser={activeItem as User}
              onItemClick={(e) => {
                onSelectorItemClicked(e, 'updateSelectedItemUser');
              }}
              hideUserStatus={chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence}
            />
          ) : activeTab === 'groups' ? (
            <CometChatGroups
              activeGroup={activeItem as Group}
              headerView={groupsHeaderView()}
              onItemClick={(e) => {
                onSelectorItemClicked(e, 'updateSelectedItemGroup');
              }}
            />
          ) : null}
          {showCreateGroup && (
            <>
              <CometChatCreateGroup
                setShowCreateGroup={setShowCreateGroup}
                onGroupCreated={(group) => onGroupCreated(group)}
              />
            </>
          )}
        </>
      )}
    </>
  );
};

const MemoizedCometChatSelector = React.memo(CometChatSelector);

export { MemoizedCometChatSelector as CometChatSelector };
