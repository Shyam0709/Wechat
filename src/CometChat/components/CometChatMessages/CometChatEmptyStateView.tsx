import { getLocalizedString } from '@cometchat/chat-uikit-react';
import '../../styles/CometChatMessages/CometChatEmptyStateView.css';
import React from 'react';

export const CometChatEmptyStateView = (props: { activeTab?: string }) => {
  const { activeTab } = props;

  return (
    <div className="cometchat-empty-state-view">
      <div
        className={activeTab !== 'calls' ? 'cometchat-empty-state-view__icon' : 'cometchat-empty-state-view__icon-call'}
      />
      <div className="cometchat-empty-state-view__text">
        <div className="cometchat-empty-state-view__text-title">
          {activeTab !== 'calls' ? getLocalizedString('chat_empty_title') : getLocalizedString('call_empty_title')}
        </div>
        {activeTab !== 'calls'
          ? getLocalizedString('chat_empty_subtitle')
          : getLocalizedString('user_group_empty_state')}
      </div>
    </div>
  );
};
