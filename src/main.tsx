import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  UIKitSettingsBuilder,
  CometChatUIKit,
} from "@cometchat/chat-uikit-react";
import { setupLocalization } from "./CometChat/utils/utils";
import { BuilderSettingsProvider } from "./CometChat/context/BuilderSettingsContext";

export const COMETCHAT_CONSTANTS = {
  APP_ID: "275099406ff45b28", // Replace with your App ID
  REGION: "in", // Replace with your App Region
  AUTH_KEY: "ae256e8caa16e02e7db41b8b3e44229d0fa61ba9", // Replace with your Auth Key or leave blank if you are authenticating using Auth Token
};

const uiKitSettings = new UIKitSettingsBuilder()
  .setAppId(COMETCHAT_CONSTANTS.APP_ID)
  .setRegion(COMETCHAT_CONSTANTS.REGION)
  .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
  .subscribePresenceForAllUsers()
  .build();

CometChatUIKit.init(uiKitSettings)?.then(() => {
  setupLocalization();

  const UID = "cometchat-uid-1"; // Replace with your actual UID

  CometChatUIKit.getLoggedinUser().then((user: CometChat.User | null) => {
    if (!user) {
      CometChatUIKit.login(UID)
        .then((loggedUser: CometChat.User) => {
          console.log("Login Successful:", loggedUser);
          // Mount your app
          ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
            <BuilderSettingsProvider>
              <App />
            </BuilderSettingsProvider>
          );
        })
        .catch((error) => console.error("Login Failed:", error));
    } else {
      // User already logged in, mount app directly
      console.log("User already logged in:", user);
      ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
        <BuilderSettingsProvider>
          <App />
        </BuilderSettingsProvider>
      );
    }
  });
});
