/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import blockIcon from '../../assets/block.svg';
import deleteIcon from '../../assets/delete.svg';
import {
  Call,
  CometChat,
  Conversation,
  Group,
  GroupType,
  MessagesRequestBuilder,
  User,
} from '@cometchat/chat-sdk-javascript';
import { CometChatJoinGroup } from '../CometChatJoinGroup/CometChatJoinGroup';
import backbutton from '../../assets/arrow_back.svg';
import addMembersIcon from '../../assets/addMembers.svg';
import leaveGroupIcon from '../../assets/leaveGroup.svg';
import '../../styles/CometChatSelector/CometChatTabs.css';
import '../../styles/CometChatSelector/CometChatSelector.css';
import '../../styles/CometChatNewChat/CometChatNewChatView.css';
import '../../styles/CometChatMessages/CometChatMessages.css';
import '../../styles/CometChatDetails/CometChatDetails.css';
import '../../styles/CometChatBuilderApp.css';
import { CometChatEmptyStateView } from '../CometChatMessages/CometChatEmptyStateView';
import { AppContext } from '../../context/AppContext';
import { CometChatBannedMembers } from '../CometChatBannedMembers/CometChatBannedMembers';
import { CometChatAddMembers } from '../CometChatAddMembers/CometChatAddMembers';
import { CometChatTransferOwnership } from '../CometChatTransferOwnership/CometChatTransferOwnership';
import { CometChatMessages } from '../CometChatMessages/CometChatMessages';
import { CometChatTabs } from '../CometChatSelector/CometChatTabs';
import { CometChatSelector } from '../CometChatSelector/CometChatSelector';
import { CometChatUserDetails } from '../CometChatDetails/CometChatUserDetails';
import { CometChatThreadedMessages } from '../CometChatDetails/CometChatThreadedMessages';
import { CometChatCallDetails } from '../CometChatCallLog/CometChatCallLogDetails';
import { CometChatAlertPopup } from '../CometChatAlertPopup/CometChatAlertPopup';
import {
  CometChatAvatar,
  CometChatButton,
  CometChatConfirmDialog,
  CometChatConversationEvents,
  CometChatGroupEvents,
  CometChatGroupMembers,
  CometChatGroups,
  CometChatIncomingCall,
  CometChatMessageEvents,
  CometChatToast,
  CometChatUIKit,
  CometChatUIKitConstants,
  CometChatUIKitLoginListener,
  CometChatUIKitUtility,
  CometChatUserEvents,
  CometChatUsers,
  getLocalizedString,
  CometChatUIEvents,
  IMouseEvent,
  IActiveChatChanged,
  IGroupMemberKickedBanned,
  IGroupMemberAdded,
} from '@cometchat/chat-uikit-react';
import { CallLog, CometChatCalls } from '@cometchat/calls-sdk-javascript';
import { useBuilderSettingContext } from '../../context/BuilderSettingsContext';
import useSystemColorScheme from '../../customHooks';

interface TabContentProps {
  selectedTab: string;
}

interface ThreadProps {
  message: CometChat.BaseMessage;
}

interface CometChatHomeProps {
  defaultUser?: CometChat.User;
  defaultGroup?: CometChat.Group;
}

function CometChatHome({ defaultUser, defaultGroup }: CometChatHomeProps) {
  const { chatFeatures, styleFeatures, layoutFeatures } = useBuilderSettingContext();
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const [group, setGroup] = useState<Group>();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(layoutFeatures.tabs[0]);
  const [selectedItem, setSelectedItem] = useState<Conversation | User | Group | Call | CallLog | undefined>();
  const [showNewChat, setShowNewChat] = useState<boolean>(false);
  const showJoinGroupRef = useRef(false);
  const [newChat, setNewChat] = useState<
    | {
        user?: CometChat.User;
        group?: CometChat.Group;
      }
    | undefined
  >();
  const [showAlertPopup, setShowAlertPopup] = useState({ visible: false, description: '' });
  const [showToast, setShowToast] = useState(false);
  const toastTextRef = useRef<string>('');
  const { appState, setAppState } = useContext(AppContext);
  const freshChatRef = useRef<Conversation | undefined>(undefined);

  const colorScheme = useSystemColorScheme();

  useEffect(() => {
    const ccOwnershipChanged = CometChatGroupEvents.ccOwnershipChanged.subscribe(() => {
      toastTextRef.current = getLocalizedString('ownership_transferred_successfully');
      setShowToast(true);
    });
    const ccGroupMemberScopeChanged = CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(() => {
      toastTextRef.current = getLocalizedString('permissions_updated_successfully');
      setShowToast(true);
    });
    const ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe(() => {
      toastTextRef.current = getLocalizedString('member_added');
      setShowToast(true);
    });
    const ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe(() => {
      toastTextRef.current = getLocalizedString('member_banned');
      setShowToast(true);
    });
    const ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe(() => {
      toastTextRef.current = getLocalizedString('member_removed');
      setShowToast(true);
    });
    return () => {
      ccOwnershipChanged?.unsubscribe();
      ccGroupMemberScopeChanged?.unsubscribe();
      ccGroupMemberAdded?.unsubscribe();
      ccGroupMemberBanned?.unsubscribe();
      ccGroupMemberKicked?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const user = CometChatUIKitLoginListener.getLoggedInUser();
    setLoggedInUser(user);
  }, []);

  useEffect(() => {
    const isMessageListOpen =
      selectedItem &&
      (selectedItem instanceof CometChat.User ||
        selectedItem instanceof CometChat.Group ||
        selectedItem instanceof CometChat.Conversation);

    if (activeTab === 'chats' || isMessageListOpen) return;
    const messageListenerId = `misc-message_${Date.now()}`;
    attachMessageReceivedListener(messageListenerId);

    return () => {
      CometChat.removeMessageListener(messageListenerId);
    };
  }, [activeTab, selectedItem]);

  useEffect(() => {
    const chatChanged = CometChatUIEvents.ccActiveChatChanged.subscribe((activeChat: IActiveChatChanged) => {
      if (activeChat && !activeChat.message) {
        setAppState({ type: 'updateIsFreshChat', payload: true });
      } else {
        setAppState({ type: 'updateIsFreshChat', payload: false });
        freshChatRef.current = undefined;
      }
    });

    return () => chatChanged.unsubscribe();
  }, []);

  /**
   * Handles new received messages
   */
  const onMessageReceived = useCallback(async (message: CometChat.BaseMessage): Promise<void> => {
    if (
      message.getSender().getUid() !== CometChatUIKitLoginListener.getLoggedInUser()?.getUid() &&
      !message.getDeliveredAt()
    ) {
      try {
        CometChat.markAsDelivered(message);
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  const attachMessageReceivedListener = useCallback(
    (messageListenerId: string) => {
      CometChat.addMessageListener(
        messageListenerId,
        new CometChat.MessageListener({
          onTextMessageReceived: (textMessage: CometChat.TextMessage) => {
            onMessageReceived(textMessage);
          },
          onMediaMessageReceived: (mediaMessage: CometChat.MediaMessage) => {
            onMessageReceived(mediaMessage);
          },
          onCustomMessageReceived: (customMessage: CometChat.CustomMessage) => {
            onMessageReceived(customMessage);
          },
        })
      );
    },
    [onMessageReceived]
  );
  const updateUserAfterBlockUnblock = (user: User) => {
    if (appState.selectedItemUser?.getUid() === user.getUid()) {
      setAppState({ type: 'updateSelectedItemUser', payload: user });
    }
    if ((appState.selectedItem?.getConversationWith() as User)?.getUid?.() === user.getUid()) {
      appState.selectedItem?.setConversationWith(user);
      setAppState({ type: 'updateSelectedItem', payload: appState.selectedItem });
    }
  };

  const TabComponent = () => {
    const onTabClicked = (tabItem: { name: string; icon: string }) => {
      setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
      setNewChat(undefined);
      setActiveTab(tabItem.name.toLowerCase());
    };

    return <CometChatTabs onTabClicked={onTabClicked} activeTab={activeTab} />;
  };

  const fetchDefaultUser = () => {
    const limit = 30,
      userRequest: CometChat.UsersRequest = new CometChat.UsersRequestBuilder().setLimit(limit).build();

    userRequest.fetchNext().then(
      (userList: CometChat.User[]) => {
        setSelectedItem(userList[0]);
      },
      (error: CometChat.CometChatException) => {
        console.error('Users list fetching failed with error:', error);
      }
    );
  };

  const fetchDefaultGroup = () => {
    const limit = 30,
      groupRequest: CometChat.GroupsRequest = new CometChat.GroupsRequestBuilder().setLimit(limit).build();

    groupRequest.fetchNext().then(
      (groupList: CometChat.Group[]) => {
        setSelectedItem(groupList[0]);
      },
      (error: CometChat.CometChatException) => {
        console.error('Group list fetching failed with error:', error);
      }
    );
  };
  const fetchDefaultCallDetail = () => {
    const callLog = new CometChatCalls.CallLogRequestBuilder()
      .setLimit(30)
      .setAuthToken(loggedInUser?.getAuthToken() as string)
      .setCallCategory('call')
      .build();

    callLog.fetchNext().then(
      (callList: CallLog[]) => {
        setSelectedItem(callList[0]);
      },
      (error: CometChat.CometChatException) => {
        console.error('Call list fetching failed with error:', error);
      }
    );
  };

  const fetchDefaultConversation = () => {
    let conversationType = 'user';
    if (layoutFeatures && layoutFeatures?.chatType === 'group') {
      conversationType = 'group';
    }

    if (defaultUser && conversationType === 'user' && !layoutFeatures.withSideBar) {
      CometChat.getConversation(defaultUser.getUid(), conversationType).then(
        (conversation) => {
          setSelectedItem(conversation);
        },
        (error) => {
          console.log('error while fetching a conversation', error);
        }
      );
    } else if (defaultGroup && conversationType === 'group' && !layoutFeatures.withSideBar) {
      CometChat.getConversation(defaultGroup.getGuid(), conversationType).then(
        (conversation) => {
          setSelectedItem(conversation);
        },
        (error) => {
          console.log('error while fetching a conversation', error);
        }
      );
    } else if (activeTab === 'chats' || !layoutFeatures.withSideBar) {
      const limit = 30,
        conversationsRequest: CometChat.ConversationsRequest = new CometChat.ConversationsRequestBuilder()
          .setLimit(limit)
          .setConversationType(conversationType)
          .build();

      conversationsRequest.fetchNext().then(
        (conversationList: CometChat.Conversation[]) => {
          setSelectedItem(conversationList?.[0]);
        },
        (error: CometChat.CometChatException) => {
          console.error('Conversations list fetching failed with error:', error);
        }
      );
    }
  };
  useEffect(() => {
    if (layoutFeatures && layoutFeatures?.tabs && layoutFeatures?.withSideBar) {
      if (layoutFeatures?.tabs?.includes('chats')) {
        fetchDefaultConversation();
        setActiveTab('chats');
      } else if (layoutFeatures?.tabs?.includes('calls')) {
        if (loggedInUser) {
          fetchDefaultCallDetail();
        }
        setActiveTab('calls');
      } else if (layoutFeatures?.tabs?.includes('users')) {
        setActiveTab('users');
        fetchDefaultUser();
      } else {
        setActiveTab('groups');
        fetchDefaultGroup();
      }
    }

    if (!layoutFeatures?.withSideBar) {
      fetchDefaultConversation();
      setActiveTab('chats');
    }
  }, [layoutFeatures?.tabs, layoutFeatures?.withSideBar, loggedInUser]);

  useEffect(() => {
    if (activeTab === 'chats' && appState.selectedItem) {
      setSelectedItem(appState.selectedItem);
    } else if (activeTab === 'users' && appState.selectedItemUser) {
      setSelectedItem(appState.selectedItemUser);
    } else if (activeTab === 'groups' && appState.selectedItemGroup) {
      setSelectedItem(appState.selectedItemGroup);
    } else if (activeTab === 'calls' && appState.selectedItemCall) {
      setSelectedItem(appState.selectedItemCall);
    } else {
      setSelectedItem(undefined);
    }
  }, [activeTab]);

  const InformationComponent = useCallback(() => {
    return (
      <>
        {showNewChat ? (
          <CometChatNewChatView />
        ) : selectedItem || newChat?.user || newChat?.group ? (
          <CometChatMessagesViewComponent />
        ) : (
          <CometChatEmptyStateView activeTab={activeTab} />
        )}
      </>
    );
  }, [activeTab, showNewChat, selectedItem, newChat]);

  const CometChatMessagesViewComponent = () => {
    const [showComposer, setShowComposer] = useState(true);
    const [messageUser, setMessageUser] = useState<User>();
    const [messageGroup, setMessageGroup] = useState<Group>();
    const [threadedMessage, setThreadedMsg] = useState<CometChat.BaseMessage | undefined>();
    const { layoutFeatures } = useBuilderSettingContext();

    useEffect(() => {
      if (newChat?.user) {
        setMessageUser(newChat.user);
        setMessageGroup(undefined);
      } else if (newChat?.group) {
        setMessageUser(undefined);
        setMessageGroup(newChat.group);
      } else {
        if (activeTab === 'chats') {
          if (
            (selectedItem as Conversation)?.getConversationType?.() === CometChatUIKitConstants.MessageReceiverType.user
          ) {
            setMessageUser((selectedItem as Conversation)?.getConversationWith() as User);
            setMessageGroup(undefined);
          } else if (
            (selectedItem as Conversation)?.getConversationType?.() ===
            CometChatUIKitConstants.MessageReceiverType.group
          ) {
            setMessageUser(undefined);
            setMessageGroup((selectedItem as Conversation)?.getConversationWith() as Group);
          }
        } else if (activeTab === 'users') {
          setMessageUser(selectedItem as User);
          setMessageGroup(undefined);
        } else if (activeTab === 'groups') {
          setMessageUser(undefined);
          setMessageGroup(selectedItem as Group);
        } else {
          setMessageUser(undefined);
          setMessageGroup(undefined);
        }
      }
    }, [activeTab, selectedItem]);

    const subscribeToEvents = () => {
      const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((user) => {
        if (user.getBlockedByMe()) {
          setShowComposer(false);
        }
        updateUserAfterBlockUnblock(user);
      });
      const ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe((user) => {
        if (!user.getBlockedByMe()) {
          setShowComposer(true);
        }
        updateUserAfterBlockUnblock(user);
      });
      const ccMessageDeleted = CometChatMessageEvents.ccMessageDeleted.subscribe((message) => {
        if (message.getId() === threadedMessage?.getId()) {
          setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
        }
      });
      const ccMessageSent = CometChatMessageEvents.ccMessageSent.subscribe(({ message }) => {
        if (!selectedItem) {
          const convId = message.getReceiverId();
          const convType = message.getReceiverType();
          CometChat.getConversation(convId!, convType).then(
            (conversation) => {
              setAppState({ type: 'updateIsFreshChat', payload: false });
              freshChatRef.current = conversation;
            },
            (error) => {
              console.log('error while fetching a conversation', error);
            }
          );
        }
      });

      return () => {
        ccUserBlocked?.unsubscribe();
        ccUserUnblocked?.unsubscribe();
        ccMessageDeleted?.unsubscribe();
        ccMessageSent?.unsubscribe();
      };
    };

    useEffect(() => {
      if (messageUser?.getBlockedByMe?.()) {
        setShowComposer(false);
      }
      const unsubscribeFromEvents = subscribeToEvents();
      return () => {
        unsubscribeFromEvents();
      };
    }, [subscribeToEvents, selectedItem]);

    const showSideComponent = () => {
      let type = '';
      if (activeTab === 'chats') {
        if ((selectedItem as Conversation)?.getConversationType() === 'group') {
          type = 'group';
        } else {
          type = 'user';
        }
      } else if (activeTab === 'users') {
        type = 'user';
      } else if (activeTab === 'groups') {
        type = 'group';
      }

      if (newChat?.user) {
        type = 'user';
      } else if (newChat?.group) {
        type = 'group';
      }
      setAppState({ type: 'updateSideComponent', payload: { visible: true, type } });
    };

    const headerMenu = () => {
      return <div className="cometchat-header__info" onClick={showSideComponent} />;
    };

    const updateThreadedMessage = (message: CometChat.BaseMessage) => {
      setThreadedMsg(message);
      setAppState({ type: 'updateSideComponent', payload: { visible: true, type: 'threadedMessage' } });
      setAppState({ type: 'updateThreadedMessage', payload: message });
    };

    const onBack = () => {
      setSelectedItem(undefined);
      setNewChat(undefined);
      setAppState({ type: 'updateSelectedItem', payload: undefined });
      setAppState({ type: 'updateSelectedItemUser', payload: undefined });
      setAppState({ type: 'updateSelectedItemGroup', payload: undefined });
      setAppState({ type: 'newChat', payload: undefined });
    };

    let messageComponent = (
      <CometChatMessages
        user={messageUser}
        group={messageGroup}
        onBack={onBack}
        headerMenu={headerMenu}
        onThreadRepliesClick={(message) => updateThreadedMessage(message)}
        showComposer={showComposer}
      />
    );
    if (
      ((layoutFeatures.chatType === 'user' && defaultUser) || (layoutFeatures.chatType === 'group' && defaultGroup)) &&
      !layoutFeatures?.withSideBar
    ) {
      messageComponent = (
        <CometChatMessages
          user={layoutFeatures.chatType === 'user' ? defaultUser : undefined}
          group={layoutFeatures.chatType === 'group' ? defaultGroup : undefined}
          onBack={onBack}
          headerMenu={headerMenu}
          onThreadRepliesClick={(message) => updateThreadedMessage(message)}
          showComposer={showComposer}
        />
      );
    }

    return (
      <>
        {(selectedItem as any)?.mode === 'call' ? (
          <CometChatCallDetails
            selectedItem={selectedItem as Call}
            onBack={() => {
              setSelectedItem(undefined);
              setAppState({ type: 'updateSelectedItemCall', payload: undefined });
            }}
          />
        ) : (
          messageComponent
        )}
      </>
    );
  };

  const CometChatNewChatView: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<string>('user');
    const [group, setGroup] = useState<Group>();
    const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
    const { chatFeatures } = useBuilderSettingContext();

    const handleTabClick = (tab: string) => {
      setSelectedTab(tab);
    };

    const joinGroup = (e: Group) => {
      if (!e.getHasJoined()) {
        if (e.getType() === CometChatUIKitConstants.GroupTypes.public) {
          CometChat.joinGroup(e.getGuid(), e.getType() as GroupType)
            .then((response: any) => {
              setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
              response.setHasJoined?.(true);
              response.setScope?.(CometChatUIKitConstants.groupMemberScope.participant);
              setNewChat({ group: response, user: undefined });
              setShowNewChat(false);
              setTimeout(() => {
                CometChatGroupEvents.ccGroupMemberJoined.next({
                  joinedGroup: response,
                  joinedUser: loggedInUser!,
                });
              }, 100);
            })
            .catch((error: unknown) => {
              console.error(error);
            });
        } else {
          setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
          setGroup(e);
          showJoinGroupRef.current = true;
        }
      } else {
        setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
        setNewChat({ group: e, user: undefined });
        setShowNewChat(false);
      }
    };

    const TabContent: React.FC<TabContentProps> = ({ selectedTab }) => {
      return selectedTab === 'user' ? (
        <CometChatUsers
          onItemClick={(user: CometChat.User) => {
            setNewChat({ user, group: undefined });
            setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
            setShowNewChat(false);
          }}
          hideUserStatus={chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence}
        />
      ) : (
        <CometChatGroups
          groupsRequestBuilder={new CometChat.GroupsRequestBuilder().joinedOnly(true).setLimit(30)}
          onItemClick={(e: CometChat.Group) => joinGroup(e)}
        />
      );
    };

    return (
      <div className="cometchat-new-chat-view">
        {showJoinGroupRef.current && group && (
          <CometChatJoinGroup
            group={group}
            onHide={() => (showJoinGroupRef.current = false)}
            onProtectedGroupJoin={(group) => {
              if (activeTab === 'chats') {
                setShowNewChat(false);
                const convId = group?.getGuid();
                const convType = CometChatUIKitConstants.MessageReceiverType.group;
                CometChat.getConversation(convId!, convType).then(
                  (conversation) => {
                    setSelectedItem(conversation);
                  },
                  (error) => {
                    setSelectedItem(undefined);
                    console.error('error while fetching a conversation', error);
                  }
                );
              } else {
                setSelectedItem(group);
              }
            }}
          />
        )}
        {/* Header with back icon and title */}
        <div className="cometchat-new-chat-view__header">
          <CometChatButton
            iconURL={backbutton}
            onClick={() => {
              setShowNewChat(false);
            }}
          />
          <div className="cometchat-new-chat-view__header-title">New Chat</div>
        </div>

        {/* Tabs for User and Group */}
        <div className="cometchat-new-chat-view__tabs">
          <div
            className={`cometchat-new-chat-view__tabs-tab ${selectedTab === 'user' ? 'cometchat-new-chat-view__tabs-tab-active' : ''}`}
            onClick={() => handleTabClick('user')}
          >
            {' '}
            {getLocalizedString('user_title')}
          </div>
          <div
            className={`cometchat-new-chat-view__tabs-tab ${selectedTab === 'group' ? 'cometchat-new-chat-view__tabs-tab-active' : ''}`}
            onClick={() => handleTabClick('group')}
          >
            {' '}
            {getLocalizedString('group_title')}
          </div>
        </div>

        {/* Dynamic content based on selected tab */}
        <div style={{ overflow: 'hidden' }}>
          <TabContent selectedTab={selectedTab} />
        </div>
      </div>
    );
  };

  const SideComponent = React.memo(() => {
    const [group, setGroup] = useState<CometChat.Group>();
    const [user, setUser] = useState<CometChat.User>();

    useEffect(() => {
      if (activeTab === 'chats') {
        if ((selectedItem as Conversation)?.getConversationType?.() === 'user') {
          setUser((selectedItem as Conversation)?.getConversationWith() as CometChat.User);
        } else if ((selectedItem as Conversation)?.getConversationType?.() === 'group') {
          setGroup((selectedItem as Conversation).getConversationWith() as CometChat.Group);
        }
      } else if (activeTab === 'users') {
        setUser(selectedItem as CometChat.User);
      } else if (activeTab === 'groups') {
        setGroup(selectedItem as CometChat.Group);
      }
    }, [selectedItem, activeTab]);

    useEffect(() => {
      if (newChat?.user) {
        setUser(newChat.user);
      } else if (newChat?.group) {
        setGroup(newChat.group);
      }
    }, [newChat]);

    return (
      <>
        {appState.sideComponent.visible && (
          <div className="side-component-wrapper">
            {appState.sideComponent.type === 'user' && user && <SideComponentUser user={user} />}
            {appState.sideComponent.type === 'group' && group && <SideComponentGroup group={group} />}
            {appState.sideComponent.type === 'threadedMessage' && appState.threadedMessage && (
              <SideComponentThread message={appState.threadedMessage} />
            )}
          </div>
        )}
      </>
    );
  });

  SideComponent.displayName = 'SideComponent';

  const SideComponentUser = (props: { user: CometChat.User }) => {
    const { user } = props;

    const actionItemsArray = [
      {
        id: 'block-unblock',
        name: user.getBlockedByMe?.()
          ? getLocalizedString('user_details_unblock')
          : getLocalizedString('user_details_block'),
        icon: blockIcon,
      },
      {
        id: 'delete',
        name: getLocalizedString('delete_chat'),
        icon: deleteIcon,
      },
    ];
    const [actionItems, setActionItems] = useState(actionItemsArray);
    const [showStatus, setShowStatus] = useState(true);
    const [showBlockUserDialog, setShowBlockUserDialog] = useState(false);
    const [showDeleteConversationDialog, setShowDeleteConversationDialog] = useState(false);

    const onBlockUserClicked: () => Promise<void> = () => {
      const UID = user.getUid();
      return new Promise((resolve, reject) => {
        CometChat.blockUsers([UID]).then(
          () => {
            user.setBlockedByMe(true);
            CometChatUserEvents.ccUserBlocked.next(user);
            toastTextRef.current = getLocalizedString('blocked_successfully');
            setShowToast(true);
            return resolve();
          },
          () => {
            return reject();
          }
        );
      });
    };

    const onUnblockUserClicked = () => {
      const UID = user.getUid();
      CometChat.unblockUsers([UID]).then(
        () => {
          setActionItems([
            {
              id: 'block-unblock',
              name: getLocalizedString('user_details_block'),
              icon: blockIcon,
            },
            {
              id: 'delete',
              name: getLocalizedString('delete_chat'),
              icon: deleteIcon,
            },
          ]);
          user.setBlockedByMe(false);
          CometChatUserEvents.ccUserUnblocked.next(user);
        },
        (error) => {
          console.log('Blocking user fails with error', error);
        }
      );
    };

    const onDeleteConversationClicked: () => Promise<void> = () => {
      const UID = user.getUid();
      return new Promise((resolve, reject) => {
        CometChat.deleteConversation(UID, 'user')
          .then(() => {
            setSelectedItem(undefined);
            setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
            CometChatConversationEvents.ccConversationDeleted.next(
              ((selectedItem as Conversation) || (freshChatRef.current as Conversation))!
            );
            toastTextRef.current = getLocalizedString('chat_deleted_successfully');
            setShowToast(true);
            return resolve();
          })
          .then((error) => {
            console.error('error while deleting a conversation', error);
            return reject();
          });
      });
    };

    const onUserActionClick = (item: { name: string; icon: string }) => {
      if (item.name === getLocalizedString('user_details_block')) {
        setShowBlockUserDialog(true);
      } else if (item.name === getLocalizedString('user_details_unblock')) {
        onUnblockUserClicked();
      } else if (item.name === getLocalizedString('delete_chat')) {
        setShowDeleteConversationDialog(true);
      }
    };

    const subscribeToEvents = () => {
      const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((user) => {
        if (user.getBlockedByMe()) {
          setShowStatus(false);
          setActionItems([
            {
              id: 'block-unblock',
              name: getLocalizedString('user_details_unblock'),
              icon: blockIcon,
            },
            {
              id: 'delete',
              name: getLocalizedString('delete_chat'),
              icon: deleteIcon,
            },
          ]);
        }
        updateUserAfterBlockUnblock(user);
      });
      const ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe((user) => {
        if (!user.getBlockedByMe()) {
          setShowStatus(true);
          setActionItems([
            {
              id: 'block-unblock',
              name: getLocalizedString('user_details_block'),
              icon: blockIcon,
            },
            {
              id: 'delete',
              name: getLocalizedString('delete_chat'),
              icon: deleteIcon,
            },
          ]);
        }
        updateUserAfterBlockUnblock(user);
      });

      return () => {
        ccUserBlocked?.unsubscribe();
        ccUserUnblocked?.unsubscribe();
      };
    };

    useEffect(() => {
      if (user.getHasBlockedMe()) {
        setShowStatus(false);
      }
      const unsubscribeFromEvents = subscribeToEvents();
      return () => {
        unsubscribeFromEvents();
      };
    }, [subscribeToEvents, selectedItem]);

    const onHide = () => setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });

    const getDeleteConversationConfirmationView = () => {
      return (
        <>
          <div className="cometchat-delete-chat-dialog__backdrop">
            <CometChatConfirmDialog
              title={getLocalizedString('delete_chat')}
              messageText={getLocalizedString('confirm_delete_chat')}
              confirmButtonText={getLocalizedString('conversation_delete_title')}
              onCancelClick={() => {
                setShowDeleteConversationDialog(!showDeleteConversationDialog);
              }}
              onSubmitClick={onDeleteConversationClicked}
            />
          </div>
        </>
      );
    };

    const getBlockUserConfirmationDialogView = () => {
      return (
        <>
          <div className="cometchat-block-user-dialog__backdrop">
            <CometChatConfirmDialog
              title={getLocalizedString('block_contact')}
              messageText={getLocalizedString('confirm_block_contact')}
              confirmButtonText={getLocalizedString('user_details_block')}
              onCancelClick={() => {
                setShowBlockUserDialog(!showBlockUserDialog);
              }}
              onSubmitClick={onBlockUserClicked}
            />
          </div>
        </>
      );
    };

    return (
      <>
        {showDeleteConversationDialog && getDeleteConversationConfirmationView()}
        {showBlockUserDialog && getBlockUserConfirmationDialogView()}
        <CometChatUserDetails
          user={user}
          actionItems={actionItems}
          onHide={onHide}
          showStatus={showStatus}
          onUserActionClick={onUserActionClick}
        />
      </>
    );
  };
  interface ActionItem {
    id: string;
    name: string;
    icon: string; // assuming the icon is a string, you can adjust based on the actual type (e.g., JSX.Element)
    type: 'scope' | 'alert'; // You can list the valid types here
    onClick: () => void; // Function that triggers the action
    isAllowed: () => boolean; // Function that checks if the action is allowed
  }

  const SideComponentGroup = React.memo((props: { group: CometChat.Group }) => {
    const [groupTab, setGroupTab] = useState('view');
    const [showAddMembers, setShowAddMembers] = useState(false);
    const [showLeaveGroup, setShowLeaveGroup] = useState(false);
    const [showTransferownershipDialog, setShowTransferownershipDialog] = useState(false);
    const [showDeleteGroup, setShowDeleteGroup] = useState(false);
    const [showTransferOwnership, setShowTransferOwnership] = useState(false);
    const [showDeleteGroupChatDialog, setShowDeleteGroupChatDialog] = useState(false);
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [scopeChanged, setScopeChanged] = useState(false);
    const { group } = props;
    const groupListenerRef = useRef('groupinfo_GroupListener_' + String(Date.now()));
    const [memberCount, setMemberCount] = useState(group.getMembersCount());
    const { chatFeatures } = useBuilderSettingContext();

    useEffect(() => {
      CometChat.addGroupListener(
        groupListenerRef.current,
        new CometChat.GroupListener({
          onGroupMemberScopeChanged: (
            message: CometChat.Action,
            changedUser: CometChat.GroupMember,
            newScope: CometChat.GroupMemberScope,
            oldScope: CometChat.GroupMemberScope,
            changedGroup: CometChat.Group
          ) => {
            if (changedGroup.getGuid() !== group?.getGuid()) {
              return;
            }
            if (changedUser.getUid() === loggedInUser?.getUid()) {
              setGroup(changedGroup);
              setScopeChanged(true);
            }
          },
          onGroupMemberKicked: (
            message: CometChat.BaseMessage,
            kickedUser: CometChat.User,
            kickedBy: CometChat.User,
            kickedFrom: CometChat.Group
          ): void => {
            setMemberCount(kickedFrom.getMembersCount());
            setGroup(kickedFrom);
          },
          onGroupMemberBanned: (
            message: CometChat.BaseMessage,
            bannedUser: CometChat.User,
            bannedBy: CometChat.User,
            bannedFrom: CometChat.Group
          ): void => {
            setMemberCount(bannedFrom.getMembersCount());
            setGroup(bannedFrom);
          },
          onMemberAddedToGroup: (
            message: CometChat.BaseMessage,
            userAdded: CometChat.User,
            userAddedBy: CometChat.User,
            userAddedIn: CometChat.Group
          ): void => {
            setMemberCount(userAddedIn.getMembersCount());
            setGroup(userAddedIn);
          },
          onGroupMemberLeft: (
            message: CometChat.BaseMessage,
            leavingUser: CometChat.GroupMember,
            group: CometChat.Group
          ): void => {
            setMemberCount(group.getMembersCount());
            setGroup(group);
          },
          onGroupMemberJoined: (
            message: CometChat.BaseMessage,
            joinedUser: CometChat.GroupMember,
            joinedGroup: CometChat.Group
          ): void => {
            setMemberCount(joinedGroup.getMembersCount());
            setGroup(joinedGroup);
          },
        })
      );

      const ccGroupMemberAdded = CometChatGroupEvents.ccGroupMemberAdded.subscribe((item: IGroupMemberAdded) => {
        setMemberCount(item.userAddedIn.getMembersCount());
        setGroup(item.userAddedIn);
      });
      const ccGroupMemberBanned = CometChatGroupEvents.ccGroupMemberBanned.subscribe(
        (item: IGroupMemberKickedBanned) => {
          setMemberCount(item.kickedFrom.getMembersCount());
          setGroup(item.kickedFrom);
        }
      );
      const ccGroupMemberKicked = CometChatGroupEvents.ccGroupMemberKicked.subscribe(
        (item: IGroupMemberKickedBanned) => {
          setMemberCount(item.kickedFrom.getMembersCount());
          setGroup(item.kickedFrom);
        }
      );
      return () => {
        ccGroupMemberAdded?.unsubscribe();
        ccGroupMemberBanned?.unsubscribe();
        ccGroupMemberKicked?.unsubscribe();
        CometChat.removeGroupListener(groupListenerRef.current);
      };
    }, [group]);

    useEffect(() => {
      const tempActionItems: ActionItem[] = [
        {
          id: 'addMembersToGroups',
          name: 'Add Members',
          icon: addMembersIcon,
          type: 'scope',
          onClick: () => {
            setShowAddMembers(!showAddMembers);
          },
          isAllowed: () => {
            return isAdminOrOwner();
          },
        },
        {
          id: 'deleteChat',
          name: 'Delete Chat',
          icon: deleteIcon,
          type: 'alert',
          onClick: () => {
            setShowDeleteGroupChatDialog(true);
          },
          isAllowed: () => {
            return true;
          },
        },
        {
          id: 'joinLeaveGroup',
          name: 'Leave',
          icon: leaveGroupIcon,
          type: 'alert',
          onClick: () => {
            if (group.getOwner() === CometChatUIKitLoginListener.getLoggedInUser()?.getUid()) {
              setShowTransferownershipDialog(!showTransferownershipDialog);
            } else {
              setShowLeaveGroup(!showLeaveGroup);
            }
          },
          isAllowed: () => {
            return (
              group.getMembersCount() > 1 ||
              (group.getMembersCount() === 1 && loggedInUser?.getUid() !== group.getOwner())
            );
          },
        },
        {
          id: 'deleteGroup',
          name: 'Delete and Exit',
          icon: deleteIcon,
          type: 'alert',
          onClick: () => {
            setShowDeleteGroup(!showDeleteGroup);
          },
          isAllowed: () => {
            return isAdminOrOwner();
          },
        },
      ];

      // Filter action items based on groupManagement permissions
      const groupManagementPermissions = chatFeatures.groupManagement;

      const filteredActionItems: ActionItem[] = tempActionItems.filter((item) => {
        // Always include `deleteGroup` (delete chat)
        if (item.id === 'deleteChat') {
          return true;
        }
        // Include based on groupManagement permissions
        return groupManagementPermissions[
          item.id as 'createGroup' | 'addMembersToGroups' | 'joinLeaveGroup' | 'deleteGroup' | 'viewGroupMembers'
        ];
      });

      // Set the filtered action items
      setActionItems(filteredActionItems);
    }, [scopeChanged, group, memberCount, chatFeatures?.groupManagement]);
    const isAdminOrOwner = () => {
      return (
        group.getScope() === CometChatUIKitConstants.groupMemberScope.admin ||
        group.getScope() === CometChatUIKitConstants.groupMemberScope.owner
      );
    };

    function transferOwnershipDialogView() {
      return (
        <>
          <div className="cometchat-transfer-ownership-dialog__backdrop">
            <CometChatConfirmDialog
              title={getLocalizedString('ownership_transfer')}
              messageText={getLocalizedString('confirm_ownership_transfer')}
              confirmButtonText={getLocalizedString('continue')}
              onCancelClick={() => {
                setShowTransferownershipDialog(!showTransferownershipDialog);
              }}
              onSubmitClick={() => {
                return new Promise((resolve) => {
                  setShowTransferownershipDialog(!showTransferownershipDialog);
                  setShowTransferOwnership(!showTransferOwnership);
                  return resolve();
                });
              }}
            />
          </div>
        </>
      );
    }
    function transferOwnershipView() {
      return (
        <>
          <div className="cometchat-transfer-ownership__backdrop">
            <CometChatTransferOwnership
              group={group}
              onClose={() => {
                setShowTransferOwnership(!showTransferOwnership);
              }}
            />
          </div>
        </>
      );
    }
    function addMembersView() {
      return (
        <>
          <div className="cometchat-add-members-wrapper">
            <CometChatAddMembers
              showBackButton={true}
              onBack={() => {
                setShowAddMembers(!showAddMembers);
              }}
              group={group}
            />
          </div>
        </>
      );
    }
    function deleteGroupView() {
      return (
        <>
          <div className="cometchat-delete-group__backdrop">
            <CometChatConfirmDialog
              title={getLocalizedString('delete_and_exit')}
              messageText={getLocalizedString('confirm_delete_and_exit')}
              confirmButtonText={getLocalizedString('delete_and_exit_label')}
              onCancelClick={() => {
                setShowDeleteGroup(!showDeleteGroup);
              }}
              onSubmitClick={() => {
                return new Promise((resolve, reject) => {
                  CometChat.deleteGroup(group.getGuid())
                    .then(() => {
                      setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
                      setSelectedItem(undefined);
                      CometChatGroupEvents.ccGroupDeleted.next(CometChatUIKitUtility.clone(group));
                      setShowDeleteGroup(!showDeleteGroup);
                      CometChatConversationEvents.ccConversationDeleted.next((selectedItem as Conversation)!);
                      toastTextRef.current = getLocalizedString('group_left_and_chat_deleted');
                      setShowToast(true);
                      return resolve();
                    })
                    .catch(() => {
                      return reject();
                    });
                });
              }}
            />
          </div>
        </>
      );
    }
    const createGroupMemberLeftActionMessage = useCallback(
      (group: CometChat.Group, loggedInUser: CometChat.User): CometChat.Action => {
        const action = CometChatUIKitConstants.groupMemberAction.LEFT;
        const actionMessage = new CometChat.Action(
          group.getGuid(),
          CometChatUIKitConstants.MessageTypes.groupMember,
          CometChatUIKitConstants.MessageReceiverType.group,
          CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory
        );
        actionMessage.setAction(action);
        actionMessage.setActionBy(CometChatUIKitUtility.clone(loggedInUser));
        actionMessage.setActionFor(CometChatUIKitUtility.clone(group));
        actionMessage.setActionOn(CometChatUIKitUtility.clone(loggedInUser));
        actionMessage.setReceiver(CometChatUIKitUtility.clone(group));
        actionMessage.setSender(CometChatUIKitUtility.clone(loggedInUser));
        actionMessage.setConversationId('group_' + group.getGuid());
        actionMessage.setMuid(CometChatUIKitUtility.ID());
        actionMessage.setMessage(`${loggedInUser.getName()} ${action} ${loggedInUser.getUid()}`);
        actionMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        return actionMessage;
      },
      []
    );
    function leaveGroupView() {
      return (
        <>
          <div className="cometchat-leave-group__backdrop">
            <CometChatConfirmDialog
              title={getLocalizedString('leave_group')}
              messageText={getLocalizedString('confirm_leave_group')}
              confirmButtonText={getLocalizedString('leave')}
              onCancelClick={() => {
                setShowLeaveGroup(!showLeaveGroup);
              }}
              onSubmitClick={() => {
                return new Promise((resolve, reject) => {
                  CometChat.leaveGroup(group.getGuid())
                    .then(() => {
                      const loggedInUser = CometChatUIKitLoginListener.getLoggedInUser();
                      if (loggedInUser) {
                        const groupClone = CometChatUIKitUtility.clone(group);
                        groupClone.setHasJoined(false);
                        CometChatGroupEvents.ccGroupLeft.next({
                          userLeft: CometChatUIKitUtility.clone(loggedInUser),
                          leftGroup: groupClone,
                          message: createGroupMemberLeftActionMessage(groupClone, loggedInUser),
                        });
                      }
                      setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
                      setSelectedItem(undefined);
                      setShowLeaveGroup(!showLeaveGroup);
                      toastTextRef.current = getLocalizedString('group_left');
                      setShowToast(true);
                      return resolve();
                    })
                    .catch(() => {
                      return reject();
                    });
                });
              }}
            />
          </div>
        </>
      );
    }

    const onDeleteGroupConversationClicked: () => Promise<void> = () => {
      const GUID = group.getGuid();
      return new Promise(async (resolve, reject) => {
        CometChat.deleteConversation(GUID, CometChatUIKitConstants.MessageReceiverType.group).then(
          () => {
            setSelectedItem(undefined);
            setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
            CometChatConversationEvents.ccConversationDeleted.next((selectedItem as Conversation)!);
            return resolve();
          },
          (error) => {
            console.error('error while deleting a conversation', error);
            return reject();
          }
        );
      });
    };

    const getDeleteConversationConfirmationView = () => {
      return (
        <>
          <div className="cometchat-delete-chat-dialog__backdrop">
            <CometChatConfirmDialog
              title={getLocalizedString('delete_chat')}
              messageText={getLocalizedString('confirm_delete_chat')}
              confirmButtonText={getLocalizedString('conversation_delete_title')}
              onCancelClick={() => {
                setShowDeleteGroupChatDialog(!showDeleteGroupChatDialog);
              }}
              onSubmitClick={onDeleteGroupConversationClicked}
            />
          </div>
        </>
      );
    };

    return (
      <>
        <div className="side-component-header">
          <div className="side-component-header__text">{getLocalizedString('group_info')}</div>
          <div
            className="side-component-header__icon"
            onClick={() => setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } })}
          />
        </div>
        <div className="side-component-content">
          <div className="side-component-content__group">
            <div className="side-component-content__avatar">
              <CometChatAvatar image={group?.getIcon()} name={group?.getName()} />
            </div>
            <div>
              <div className="side-component-content__title">{group?.getName()}</div>
              <div className="side-component-content__description">
                {group?.getMembersCount?.() + ' ' + getLocalizedString('group_members')}
              </div>
            </div>
          </div>

          <div className="side-component-content__action">
            {actionItems.map((actionItem, index) =>
              actionItem.isAllowed() ? (
                <div
                  key={actionItem.name + index}
                  className="side-component-content__action-item"
                  onClick={() => {
                    if (actionItem.onClick) {
                      actionItem.onClick();
                    }
                  }}
                >
                  <div
                    className={
                      actionItem.type === 'alert'
                        ? `side-component-content__action-item-icon side-component-content__action-item-icon-${actionItem.id}`
                        : `side-component-content__action-item-icon-default side-component-content__action-item-icon-default-${actionItem.id}`
                    }
                    style={
                      actionItem.icon ? { WebkitMask: `url(${actionItem.icon}), center, center, no-repeat` } : undefined
                    }
                  />
                  <div
                    className={
                      actionItem.type === 'alert'
                        ? 'side-component-content__action-item-text'
                        : 'side-component-content__action-item-text-default'
                    }
                  >
                    {actionItem.name}
                  </div>
                </div>
              ) : null
            )}
          </div>
          {chatFeatures && chatFeatures?.groupManagement.viewGroupMembers && (
            <>
              {group.getScope() !== CometChatUIKitConstants.groupMemberScope.participant ? (
                <div className="side-component-group-tabs-wrapper">
                  <div className="side-component-group-tabs">
                    <div
                      className={`side-component-group-tabs__tab ${groupTab === 'view' ? 'side-component-group-tabs__tab-active' : ''}`}
                      onClick={() => setGroupTab('view')}
                    >
                      <div
                        className={`side-component-group-tabs__tab-text ${groupTab === 'view' ? 'side-component-group-tabs__tab-text-active' : ''}`}
                      >
                        {getLocalizedString('view_members')}
                      </div>
                    </div>
                    <div
                      className={`side-component-group-tabs__tab ${groupTab === 'banned' ? 'side-component-group-tabs__tab-active' : ''}`}
                      onClick={() => {
                        setGroupTab('banned');
                      }}
                    >
                      <div
                        className={`side-component-group-tabs__tab-text ${groupTab === 'banned' ? 'side-component-group-tabs__tab-text-active' : ''}`}
                      >
                        {getLocalizedString('banned_members')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div
                className={isAdminOrOwner() ? 'side-component-group-members-with-tabs' : 'side-component-group-members'}
              >
                {groupTab === 'view' ? (
                  <CometChatGroupMembers
                    group={group}
                    hideKickMemberOption={chatFeatures && !chatFeatures?.moderatorControls?.kickUsers}
                    hideScopeChangeOption={chatFeatures && !chatFeatures?.moderatorControls?.promoteDemoteMembers}
                    // hideKickMemberOption={callFeatures && !callFeatures?.voiceAndVideoCalling?.oneOnOneVideoCalling}
                    hideBanMemberOption={chatFeatures && !chatFeatures?.moderatorControls?.banUsers}
                    hideUserStatus={chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence}
                  />
                ) : groupTab === 'banned' ? (
                  <CometChatBannedMembers group={group} />
                ) : null}
              </div>
            </>
          )}
        </div>
        {showDeleteGroupChatDialog && getDeleteConversationConfirmationView()}
        {showAddMembers && group ? addMembersView() : null}
        {showLeaveGroup ? leaveGroupView() : null}
        {showDeleteGroup ? deleteGroupView() : null}
        {showTransferOwnership ? transferOwnershipView() : null}
        {showTransferownershipDialog ? transferOwnershipDialogView() : null}
      </>
    );
  });

  SideComponentGroup.displayName = 'SideComponentGroup';

  const SideComponentThread = (props: ThreadProps) => {
    const { message } = props;

    const [requestBuilderState, setRequestBuilderState] = useState<MessagesRequestBuilder>();
    const [showComposer, setShowComposer] = useState(true);

    const requestBuilder = useCallback(() => {
      const threadMessagesBuilder = new CometChat.MessagesRequestBuilder()
        .setCategories(CometChatUIKit.getDataSource().getAllMessageCategories())
        .setTypes(CometChatUIKit.getDataSource().getAllMessageTypes())
        .hideReplies(true)
        .setLimit(20)
        .setParentMessageId(message.getId());
      setRequestBuilderState(threadMessagesBuilder);
    }, [message]);

    useEffect(() => {
      const listenerID = `HomeLoginListener_${new Date().getTime()}`;
      CometChat.addLoginListener(
        listenerID,
        new CometChat.LoginListener({
          logoutSuccess: () => {
            setSelectedItem(undefined);
            setNewChat(undefined);
            setAppState({ type: 'updateSelectedItem', payload: undefined });
            setAppState({ type: 'updateSelectedItemUser', payload: undefined });
            setAppState({ type: 'updateSelectedItemGroup', payload: undefined });
            setAppState({ type: 'newChat', payload: undefined });
          },
        })
      );
      return () => CometChat.removeConnectionListener(listenerID);
    });

    useEffect(() => {
      requestBuilder();
      let currentUser: CometChat.User | null = null;

      if (selectedItem instanceof CometChat.User) {
        currentUser = selectedItem;
      } else if (
        selectedItem instanceof CometChat.Conversation &&
        selectedItem.getConversationType() === CometChat.RECEIVER_TYPE.USER &&
        selectedItem.getConversationWith() instanceof CometChat.User
      ) {
        currentUser = selectedItem.getConversationWith() as CometChat.User;
      }

      if (currentUser?.getBlockedByMe()) {
        setShowComposer(false);
      }
      const ccUserBlocked = CometChatUserEvents.ccUserBlocked.subscribe((blockedUser) => {
        if (blockedUser.getBlockedByMe()) {
          setShowComposer(false);
        }
        updateUserAfterBlockUnblock(blockedUser);
      });
      const ccUserUnblocked = CometChatUserEvents.ccUserUnblocked.subscribe((unBlockedUser) => {
        if (!unBlockedUser.getBlockedByMe()) {
          setShowComposer(true);
        }
        updateUserAfterBlockUnblock(unBlockedUser);
      });
      return () => {
        ccUserBlocked?.unsubscribe();
        ccUserUnblocked?.unsubscribe();
      };
    }, [message]);

    const onClose = () => setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });

    return (
      <CometChatThreadedMessages
        message={message}
        requestBuilderState={requestBuilderState}
        selectedItem={selectedItem || freshChatRef.current}
        onClose={onClose}
        showComposer={showComposer}
      />
    );
  };

  useEffect(() => {
    if (newChat) {
      const convId = newChat.user?.getUid() || newChat.group?.getGuid();
      const convType = newChat.user
        ? CometChatUIKitConstants.MessageReceiverType.user
        : CometChatUIKitConstants.MessageReceiverType.group;
      CometChat.getConversation(convId!, convType).then(
        (conversation) => {
          setSelectedItem(conversation);
        },
        () => {
          setSelectedItem(undefined);
        }
      );
    }
  }, [newChat, newChat?.user, newChat?.group]);

  useEffect(() => {
    fetchDefaultConversation();
    setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
  }, [layoutFeatures?.chatType]);

  const onSelectorItemClicked = (e: Conversation | User | Group | Call, type: string) => {
    setShowNewChat(false);
    if (type === 'updateSelectedItemGroup' && !(e as Group).getHasJoined()) {
      if ((e as Group).getType() === CometChatUIKitConstants.GroupTypes.public) {
        CometChat.joinGroup((e as Group).getGuid(), (e as Group).getType() as GroupType)
          .then((response: any) => {
            setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
            setNewChat(undefined);
            response.setHasJoined?.(true);
            response.setScope?.(CometChatUIKitConstants.groupMemberScope.participant);
            setSelectedItem(response as Group);
            setAppState({ type, payload: response });
            setTimeout(() => {
              CometChatGroupEvents.ccGroupMemberJoined.next({
                joinedGroup: response,
                joinedUser: loggedInUser!,
              });
            }, 100);
          })
          .catch((error: unknown) => {
            console.error(error);
          });
      } else {
        setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
        setNewChat(undefined);
        setGroup(e as Group);
        setAppState({ type, payload: e });
        showJoinGroupRef.current = true;
      }
    } else {
      setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
      setNewChat(undefined);
      setAppState({ type, payload: e });
      setSelectedItem(
        activeTab === 'chats'
          ? (e as Conversation)
          : activeTab === 'users'
            ? (e as User)
            : activeTab === 'groups'
              ? (e as Group)
              : activeTab === 'calls'
                ? (e as Call)
                : undefined
      );
    }
  };

  const subscribeToEvents = useCallback(() => {
    const ccConversationDeleted = CometChatConversationEvents.ccConversationDeleted.subscribe(
      (conversation: Conversation) => {
        if (newChat?.user && conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.user) {
          if ((conversation.getConversationWith() as User).getUid() === newChat.user.getUid()) {
            setNewChat(undefined);
            setAppState({ type: 'newChat', payload: undefined });
            setSelectedItem(undefined);
            setAppState({ type: 'updateSelectedItem', payload: undefined });
          }
        } else if (
          newChat?.group &&
          conversation.getConversationType() === CometChatUIKitConstants.MessageReceiverType.group
        ) {
          if ((conversation.getConversationWith() as Group).getGuid() === newChat.group.getGuid()) {
            setNewChat(undefined);
            setAppState({ type: 'newChat', payload: undefined });
            setSelectedItem(undefined);
            setAppState({ type: 'updateSelectedItem', payload: undefined });
          }
        } else {
          if ((selectedItem as Conversation)?.getConversationId?.() === conversation.getConversationId?.()) {
            setSelectedItem(undefined);
            setAppState({ type: 'updateSelectedItem', payload: undefined });
          }
        }
      }
    );

    const ccOpenChat = CometChatUIEvents.ccOpenChat.subscribe((item) => {
      openChatForUser(item.user);
    });

    const ccClickEvent = CometChatUIEvents.ccMouseEvent.subscribe((mouseevent: IMouseEvent) => {
      if (
        mouseevent.event.type === 'click' &&
        (mouseevent.body as { CometChatUserGroupMembersObject: User })?.CometChatUserGroupMembersObject
      ) {
        openChatForUser(
          (mouseevent.body as { CometChatUserGroupMembersObject: User })?.CometChatUserGroupMembersObject
        );
      }
    });

    const openChatForUser = (currentUser?: CometChat.User) => {
      const uid = currentUser?.getUid();
      if (uid) {
        setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
        if (activeTab === 'chats') {
          CometChat.getConversation(uid!, CometChatUIKitConstants.MessageReceiverType.user).then(
            (conversation) => {
              setNewChat(undefined);
              setSelectedItem(conversation);
              setAppState({ type: 'updateSelectedItem', payload: conversation });
            },
            () => {
              setNewChat({ user: currentUser, group: undefined });
              setSelectedItem(undefined);
            }
          );
        } else if (activeTab === 'users') {
          setNewChat(undefined);
          setSelectedItem(currentUser);
          setAppState({ type: 'updateSelectedItemUser', payload: currentUser });
        } else if (activeTab === 'groups') {
          setNewChat({ user: currentUser, group: undefined });
          setSelectedItem(undefined);
        }
      }
    };

    return () => {
      ccConversationDeleted?.unsubscribe();
      ccOpenChat?.unsubscribe();
      ccClickEvent?.unsubscribe();
    };
  }, [newChat, selectedItem]);

  const attachSDKGroupListener = () => {
    const listenerId = 'BannedOrKickedMembers_GroupListener_' + String(Date.now());
    CometChat.addGroupListener(
      listenerId,
      new CometChat.GroupListener({
        onGroupMemberBanned: (
          message: CometChat.Action,
          kickedUser: CometChat.User,
          kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          if (
            ((selectedItem as Group).getGuid?.() === kickedFrom.getGuid() ||
              ((selectedItem as Conversation).getConversationWith?.() as Group)?.getGuid?.() ===
                kickedFrom.getGuid()) &&
            kickedUser.getUid() === loggedInUser?.getUid()
          ) {
            setShowAlertPopup({ visible: true, description: getLocalizedString('member_banned') });
          }
        },
        onGroupMemberKicked: (
          message: CometChat.Action,
          kickedUser: CometChat.User,
          kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          if (
            ((selectedItem as Group).getGuid?.() === kickedFrom.getGuid() ||
              ((selectedItem as Conversation).getConversationWith?.() as Group)?.getGuid?.() ===
                kickedFrom.getGuid()) &&
            kickedUser.getUid() === loggedInUser?.getUid()
          ) {
            setShowAlertPopup({ visible: true, description: getLocalizedString('member_removed') });
          }
        },
      })
    );
    return () => CometChat.removeGroupListener(listenerId);
  };

  useEffect(() => {
    if (loggedInUser) {
      const unsubscribeFromEvents = subscribeToEvents();
      const unsubscribeFromGroupEvents = attachSDKGroupListener();
      return () => {
        unsubscribeFromEvents();
        unsubscribeFromGroupEvents();
      };
    }
  }, [loggedInUser, subscribeToEvents, attachSDKGroupListener]);

  const removedFromGroup = () => {
    setShowAlertPopup({ visible: false, description: '' });
    setSelectedItem(undefined);
    setAppState({ type: 'updateSelectedItem', payload: undefined });
    setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
  };
  function closeToast() {
    setShowToast(false);
  }

  const getActiveItem = () => {
    if (
      (activeTab === 'chats' && selectedItem instanceof CometChat.Conversation) ||
      (activeTab === 'users' && selectedItem instanceof CometChat.User) ||
      (activeTab === 'groups' && selectedItem instanceof CometChat.Group) ||
      (activeTab === 'calls' && selectedItem instanceof CallLog)
    ) {
      return selectedItem;
    } else {
      return undefined;
    }
  };

  const SideComponentWrapper = useMemo(() => {
    return <SideComponent />;
  }, [appState.sideComponent]);

  const getTheme = () => {
    let theme = 'system';
    if (styleFeatures) {
      if (styleFeatures?.theme === 'system') {
        theme = colorScheme;
      } else {
        theme = styleFeatures?.theme;
      }
    }

    return theme;
  };

  return (
    loggedInUser && (
      <div
        id={styleFeatures && `${styleFeatures?.theme}-theme`}
        className="cometchat-root"
        data-theme={styleFeatures && getTheme()}
      >
        {showAlertPopup.visible && (
          <CometChatAlertPopup
            onConfirmClick={removedFromGroup}
            title={getLocalizedString('no_longer_part_of_group')}
            description={`${getLocalizedString('you_have_been')} ${showAlertPopup.description} ${getLocalizedString('removed_by_admin')}`}
          />
        )}
        <div className={`conversations-wrapper ${!layoutFeatures?.withSideBar ? 'hide-sidebar' : ''}`}>
          <div className="selector-wrapper">
            {
              <CometChatSelector
                activeItem={getActiveItem()}
                activeTab={activeTab}
                group={group}
                onProtectedGroupJoin={(group) => setSelectedItem(group)}
                onSelectorItemClicked={onSelectorItemClicked}
                setShowCreateGroup={setShowCreateGroup}
                showCreateGroup={showCreateGroup}
                showJoinGroup={showJoinGroupRef.current}
                onHide={() => (showJoinGroupRef.current = false)}
                onNewChatClicked={() => {
                  setShowNewChat(true);
                  setAppState({ type: 'updateSideComponent', payload: { type: '', visible: false } });
                }}
                onGroupCreated={(group) => setSelectedItem(group)}
                hideCreateGroupButton={chatFeatures && !chatFeatures.groupManagement.createGroup}
              />
            }
          </div>
          <TabComponent />
        </div>
        <div className="messages-wrapper">
          <InformationComponent />
        </div>
        {SideComponentWrapper}
        <CometChatIncomingCall />
        {showToast ? <CometChatToast text={toastTextRef.current} onClose={closeToast} /> : null}
      </div>
    )
  );
}
const MemoizedCometChatHome = React.memo(CometChatHome);

export { MemoizedCometChatHome as CometChatHome };
