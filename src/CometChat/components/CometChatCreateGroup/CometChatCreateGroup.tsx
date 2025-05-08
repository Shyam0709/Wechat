import React, { useContext, useState } from 'react';
import '../../styles/CometChatCreateGroup/CometChatCreateGroup.css';
import { CometChat, Group } from '@cometchat/chat-sdk-javascript';
import { AppContext } from '../../context/AppContext';
import { CometChatGroupEvents, getLocalizedString } from '@cometchat/chat-uikit-react';

interface CreateGroupProps {
  setShowCreateGroup: React.Dispatch<React.SetStateAction<boolean>>;
  onGroupCreated?: (group: Group) => void;
}

const CometChatCreateGroup = ({ setShowCreateGroup, onGroupCreated = () => {} }: CreateGroupProps) => {
  const [groupType, setGroupType] = useState('public');
  const [groupName, setGroupName] = useState('');
  const [isGroupCreated, setIsGroupCreated] = useState(false);
  const [groupPassword, setGroupPassword] = useState('');
  const { setAppState } = useContext(AppContext);

  async function handleSubmit() {
    if (!isGroupCreated) {
      setIsGroupCreated(true);
      const GUID = `group_${new Date().getTime()}`;
      const group = new CometChat.Group(GUID, groupName, groupType, groupPassword);
      try {
        const createdGroup = await CometChat.createGroup(group);
        CometChatGroupEvents.ccGroupCreated.next(createdGroup);
        onGroupCreated(createdGroup);
        setAppState({ type: 'updateSelectedItemGroup', payload: createdGroup });
        setAppState({ type: 'updateSideComponent', payload: { visible: false, type: '' } });
        setShowCreateGroup(false);
      } catch (error) {
        console.error('Group creation failed with exception:', error);
      }
    }
  }

  return (
    <div className="cometchat-create-group__backdrop">
      <div className="cometchat-create-group">
        <div className="cometchat-create-group__title">{getLocalizedString('new_group')}</div>
        <div className="cometchat-create-group__content">
          <div className="cometchat-create-group__type-wrapper">
            <span className="cometchat-create-group__type-text">{getLocalizedString('type')}</span>
            <div className="cometchat-create-group__type-content">
              <div
                className={`cometchat-create-group__type ${groupType === 'public' ? 'cometchat-create-group__type-selected' : ''}`}
                onClick={() => setGroupType('public')}
              >
                {getLocalizedString('create_group_public')}
              </div>
              <div
                className={`cometchat-create-group__type ${groupType === 'private' ? 'cometchat-create-group__type-selected' : ''}`}
                onClick={() => setGroupType('private')}
              >
                {getLocalizedString('create_group_private')}
              </div>
              <div
                className={`cometchat-create-group__type ${groupType === 'password' ? 'cometchat-create-group__type-selected' : ''}`}
                onClick={() => setGroupType('password')}
              >
                {getLocalizedString('create_group_password')}
              </div>
            </div>
          </div>

          <div className="cometchat-create-group__name-wrapper">
            {getLocalizedString('name')}
            <input
              type="text"
              className="cometchat-create-group__input"
              placeholder="Enter the group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>
          {groupType === 'password' && (
            <div className="cometchat-create-group__password-wrapper">
              {getLocalizedString('create_group_password')}
              <input
                type="password"
                className="cometchat-create-group__input"
                placeholder="Enter a password"
                value={groupPassword}
                onChange={(e) => setGroupPassword(e.target.value)}
                required
              />
            </div>
          )}
        </div>
        <button className="cometchat-create-group__submit-button" onClick={handleSubmit}>
          {getLocalizedString('create_group')}
        </button>
        <div className="cometchat-create-group__close-button" onClick={() => setShowCreateGroup(false)} />
      </div>
    </div>
  );
};

export default CometChatCreateGroup;
