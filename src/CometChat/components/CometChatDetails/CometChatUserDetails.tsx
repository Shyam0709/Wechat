import { CometChatAvatar, getLocalizedString } from '@cometchat/chat-uikit-react';
import '../../styles/CometChatDetails/CometChatUserDetails.css';
import React, { useContext } from 'react';
import { useBuilderSettingContext } from '../../context/BuilderSettingsContext';
import { AppContext } from '../../context/AppContext';

interface UserDetailProps {
  user: CometChat.User;
  onHide?: () => void;
  actionItems?: {
    id?: string;
    name: string;
    icon: string;
  }[];
  showStatus?: boolean;
  onUserActionClick?: (item: { name: string; icon: string }) => void;
}

export const CometChatUserDetails = (props: UserDetailProps) => {
  const { user, onHide = () => {}, actionItems = [], showStatus, onUserActionClick = () => {} } = props;
  const { chatFeatures } = useBuilderSettingContext();
  const { appState } = useContext(AppContext);

  return (
    <>
      <div className="cometchat-user-details__header">
        <div className="cometchat-user-details__header-text">{getLocalizedString('user_info')}</div>
        <div className="cometchat-user-details__header-icon" onClick={onHide} />
      </div>
      <div className="cometchat-user-details__content">
        <div className="cometchat-user-details__content-avatar">
          <CometChatAvatar image={user.getAvatar?.()} name={user.getName()} />
        </div>
        <div>
          <div className="cometchat-user-details__content-title">{user.getName()}</div>
          {showStatus && chatFeatures.coreMessagingExperience.userAndFriendsPresence && (
            <div className="cometchat-user-details__content-description">
              {getLocalizedString('message_header_status_' + user.getStatus?.())}
            </div>
          )}
        </div>

        <div className="cometchat-user-details__content-action">
          {actionItems.map((actionItem) => (
            <div
              key={actionItem.name}
              className={`${appState.isFreshChat && actionItem.name === 'Delete Chat' ? 'cometchat-user-details__content-action-item-disabled' : ''} cometchat-user-details__content-action-item`}
              onClick={() =>
                appState.isFreshChat && actionItem.name === 'Delete Chat' ? () => {} : onUserActionClick(actionItem)
              }
            >
              <div
                className={`cometchat-user-details__content-action-item-icon cometchat-user-details__content-action-item-icon-${actionItem.id}`}
                style={
                  actionItem.icon ? { WebkitMask: `url(${actionItem.icon}), center, center, no-repeat` } : undefined
                }
              />
              <div className="cometchat-user-details__content-action-item-text">{actionItem.name}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
