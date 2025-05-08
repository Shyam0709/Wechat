/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import '../../styles/CometChatLogin/CometChatLogin.css';
import cometChatLogo from '../../assets/cometchat_logo.svg';
import cometChatLogoDark from '../../assets/cometchat_logo_dark.svg';
import { CometChatUIKit } from '@cometchat/chat-uikit-react';
import { sampleUsers } from './sampledata';

type User = {
  name: string;
  uid: string;
  avatar: string;
};

type UserJson = {
  users: User[];
};

const CometChatLogin = () => {
  const [defaultUsers, setDefaultUsers] = useState<User[]>([]);
  const [uid, setUid] = useState('');
  const [selectedUid, setSelectedUid] = useState('');
  const isDarkMode = document.querySelector('[data-theme="dark"]') ? true : false;

  useEffect(() => {
    fetchDefaultUsers();
    return () => {
      setDefaultUsers([]);
    };
  }, []);

  async function fetchDefaultUsers() {
    try {
      const response = await fetch('https://assets.cometchat.io/sampleapp/v2/sampledata.json');
      const data: UserJson = await response.json();
      setDefaultUsers(data.users);
    } catch (error) {
      setDefaultUsers(sampleUsers.users as any);
      console.error('fetching default users failed, using fallback data', error);
    }
  }

  async function login(uid: string) {
    setSelectedUid(uid);
    try {
      CometChatUIKit.login(uid)?.then((loggedInUser) => {
        console.log('Login successful, loggedInUser:', loggedInUser);
      });
    } catch (error) {
      console.error('login failed', error);
    }
  }

  async function handleLoginWithUidFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await login(uid);
    } catch (error) {
      console.error(error);
    }
  }

  function getUserBtnWithKeyAdded({ name, uid, avatar }: User) {
    return (
      <>
        <div
          key={uid}
          onClick={() => login(uid)}
          className={`cometchat-login__user ${selectedUid === uid ? 'cometchat-login__user-selected ' : ''}`}
        >
          {selectedUid === uid ? (
            <>
              <div className="cometchat-login__user-selection-indicator">
                <div className="cometchat-login__user-selection-checked"></div>
              </div>
            </>
          ) : null}

          <img src={avatar} alt={`${name}'s avatar`} className="cometchat-login__user-avatar" />
          <div className="cometchat-login__user-name-and-uid cometchat-login__user-details">
            <div className="cometchat-login__user-name">{name}</div>
            <div className="cometchat-login__user-uid">{uid}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="cometchat-login__container">
      <div className="cometchat-login__logo">
        {isDarkMode ? <img src={cometChatLogoDark} alt="" /> : <img src={cometChatLogo} alt="" />}
      </div>
      <div className="cometchat-login__content">
        <div className="cometchat-login__header">
          <div className="cometchat-login__title">Sign in to cometchat</div>
          <div className="cometchat-login__sample-users">
            <div className="cometchat-login__sample-users-title">Using our sample users</div>
            <div className="cometchat-login__user-list">{defaultUsers.map(getUserBtnWithKeyAdded)}</div>
          </div>
        </div>

        <div className="cometchat-login__divider-section" style={{ display: 'flex' }}>
          <div className="cometchat-login__divider" />
          <span className="cometchat-login__divider-text"> Or</span>

          <div className="cometchat-login__divider" />
        </div>

        <div className="cometchat-login__custom-login">
          <form onSubmit={handleLoginWithUidFormSubmit} className="cometchat-login__form">
            <div className="cometchat-login__input-group">
              <label className="input-label cometchat-login__input-label" htmlFor="">
                Your UID
              </label>
              <input
                className="cometchat-login__input"
                type="text"
                value={uid}
                onChange={(e) => {
                  setUid(e.target.value);
                }}
                required
                placeholder="Enter your UID"
              />
            </div>

            <button className="cometchat-login__submit-button">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CometChatLogin;
