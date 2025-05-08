import chatsIcon from '../../assets/chats.svg';
import callsIcon from '../../assets/calls.svg';
import usersIcon from '../../assets/users.svg';
import groupsIcon from '../../assets/groups.svg';
import '../../styles/CometChatSelector/CometChatTabs.css';
import React, { useState } from 'react';
import { getLocalizedString } from '@cometchat/chat-uikit-react';
import { useBuilderSettingContext } from '../../context/BuilderSettingsContext';

export const CometChatTabs = (props: {
  onTabClicked?: (tabItem: { name: string; icon: string }) => void;
  activeTab?: string;
}) => {
  const { onTabClicked = () => {}, activeTab } = props;
  const [hoverTab, setHoverTab] = useState('');
  const { layoutFeatures } = useBuilderSettingContext();
  const tabItems = [
    {
      id: 'chats',
      name: getLocalizedString('conversation_chat_title'),
      icon: chatsIcon,
    },
    {
      id: 'calls',
      name: getLocalizedString('call_logs_title'),
      icon: callsIcon,
    },
    {
      id: 'users',
      name: getLocalizedString('user_title'),
      icon: usersIcon,
    },
    {
      id: 'groups',
      name: getLocalizedString('group_title'),
      icon: groupsIcon,
    },
  ];

  const isTabActiveOrHovered = (name: string) => {
    const tabName = name.toLowerCase();
    return activeTab === tabName || hoverTab === tabName;
  };
  return (
    <div
      className="cometchat-tab-component"
      style={layoutFeatures?.tabs?.length > 1 ? { display: 'flex' } : { display: 'none' }}
    >
      {tabItems
        .filter(
          (tabItem) => layoutFeatures?.tabs?.includes(tabItem.id) // Keep only allowed tabs
        )
        .map((tabItem) => (
          <div key={tabItem.name} className="cometchat-tab-component__tab" onClick={() => onTabClicked(tabItem)}>
            <div
              className={`cometchat-tab-component__tab-icon cometchat-tab-component__tab-icon-${tabItem.id} ${
                isTabActiveOrHovered(tabItem.name) ? 'cometchat-tab-component__tab-icon-active' : ''
              }`}
              style={tabItem.icon ? { WebkitMask: `url(${tabItem.icon}), center, center, no-repeat` } : undefined}
              onMouseEnter={() => setHoverTab(tabItem.name.toLowerCase())}
              onMouseLeave={() => setHoverTab('')}
            />
            <div
              className={
                activeTab === tabItem.name.toLowerCase() || hoverTab === tabItem.name.toLowerCase()
                  ? 'cometchat-tab-component__tab-text cometchat-tab-component__tab-text-active'
                  : 'cometchat-tab-component__tab-text'
              }
              onMouseEnter={() => setHoverTab(tabItem.name.toLowerCase())}
              onMouseLeave={() => setHoverTab('')}
            >
              {tabItem.name}
            </div>
          </div>
        ))}
    </div>
  );
};
