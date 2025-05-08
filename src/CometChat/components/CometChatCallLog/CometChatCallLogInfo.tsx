/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { JSX, useCallback, useEffect, useState } from 'react';
import '../../styles/CometChatCallLog/CometChatCallLogInfo.css';
import {
  CalendarObject,
  CometChatDate,
  CometChatListItem,
  CometChatLocalize,
  CometChatUIKit,
  CometChatUIKitConstants,
  convertMinutesToHoursMinutesSeconds,
  getLocalizedString,
} from '@cometchat/chat-uikit-react';

export const CometChatCallDetailsInfo = (props: { call: any }) => {
  const { call } = props;
  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const [outgoingCallSuccess, setOutgoingCallSuccess] = useState<string | undefined>(undefined);
  const [callRejectedIcon, setCallRejectedIcon] = useState<string | undefined>(undefined);
  const [incomingCallIcon, setIncomingCallIcon] = useState<string | undefined>(undefined);
  const [incomingCallSuccessIcon, setIncomingCallSuccessIcon] = useState<string | undefined>(undefined);
  const [missedCallIcon, setMissedCallIcon] = useState<string | undefined>(undefined);

  useEffect(() => {
    import('../../assets/outgoingCallSuccess.svg')
      .then((module: any) => setOutgoingCallSuccess(module.default?.src || module.default))
      .catch((error) => console.error('Error loading SVG:', error));
    import('../../assets/callRejectedIcon.svg')
      .then((module: any) => setCallRejectedIcon(module.default?.src || module.default))
      .catch((error) => console.error('Error loading SVG:', error));
    import('../../assets/incomingCallIcon.svg')
      .then((module: any) => setIncomingCallIcon(module.default?.src || module.default))
      .catch((error) => console.error('Error loading SVG:', error));
    import('../../assets/incomingCallSuccess.svg')
      .then((module: any) => setIncomingCallSuccessIcon(module.default?.src || module.default))
      .catch((error) => console.error('Error loading SVG:', error));
    import('../../assets/missedCallIcon.svg')
      .then((module: any) => setMissedCallIcon(module.default?.src || module.default))
      .catch((error) => console.error('Error loading SVG:', error));
  }, []);

  useEffect(() => {
    CometChatUIKit.getLoggedinUser().then((user) => {
      setLoggedInUser(user);
    });
  }, [setLoggedInUser]);

  function getDateFormat(): CalendarObject {
    const defaultFormat = {
      yesterday: `DD MMM, hh:mm A`,
      otherDays: `DD MMM, hh:mm A`,
      today: `DD MMM, hh:mm A`,
    };

    const finalFormat = {
      ...defaultFormat,
      ...CometChatLocalize.calendarObject,
    };

    return finalFormat;
  }

  const getListItemSubtitleView = useCallback((item: any): JSX.Element => {
    return (
      <div className="cometchat-call-log-info__subtitle">
        <CometChatDate calendarObject={getDateFormat()} timestamp={item?.getInitiatedAt()}></CometChatDate>
      </div>
    );
  }, []);

  const getCallDuration = useCallback((item: any) => {
    try {
      if (item?.getTotalDurationInMinutes()) {
        return convertMinutesToHoursMinutesSeconds(item?.getTotalDurationInMinutes());
      } else {
        return false;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
  }, []);

  const getListItemTailView = useCallback(
    (item: any): JSX.Element => {
      return (
        <div
          className={
            getCallDuration(item) ? 'cometchat-call-log-info__tail-view' : 'cometchat-call-log-info__tail-view-disabled'
          }
        >
          {getCallDuration(item) ? getCallDuration(item) : '00:00'}
        </div>
      );
    },
    [getCallDuration]
  );

  const getCallStatus = (call: CometChat.Call, loggedInUser: CometChat.User): string => {
    const isSentByMe = (call: any, loggedInUser: CometChat.User) => {
      const senderUid: string = call.callInitiator?.getUid();
      return !senderUid || senderUid === loggedInUser?.getUid();
    };
    const callStatus: string = call.getStatus();
    const isSentByMeFlag: boolean = isSentByMe(call, loggedInUser!);
    if (isSentByMeFlag) {
      switch (callStatus) {
        case CometChatUIKitConstants.calls.initiated:
          return getLocalizedString('calls_outgoing_call');
        case CometChatUIKitConstants.calls.cancelled:
          return getLocalizedString('calls_cancelled_call');
        case CometChatUIKitConstants.calls.rejected:
          return getLocalizedString('calls_rejected_call');
        case CometChatUIKitConstants.calls.busy:
          return getLocalizedString('calls_missed_call');
        case CometChatUIKitConstants.calls.ended:
          return getLocalizedString('calls_ended_call');
        case CometChatUIKitConstants.calls.ongoing:
          return getLocalizedString('calls_answered_call');
        case CometChatUIKitConstants.calls.unanswered:
          return getLocalizedString('calls_unanswered_call');
        default:
          return getLocalizedString('calls_outgoing_call');
      }
    } else {
      switch (callStatus) {
        case CometChatUIKitConstants.calls.initiated:
          return getLocalizedString('calls_incoming_call');
        case CometChatUIKitConstants.calls.ongoing:
          return getLocalizedString('calls_answered_call');
        case CometChatUIKitConstants.calls.ended:
          return getLocalizedString('calls_ended_call');
        case CometChatUIKitConstants.calls.unanswered:
        case CometChatUIKitConstants.calls.cancelled:
          return getLocalizedString('calls_missed_call');
        case CometChatUIKitConstants.calls.busy:
          return getLocalizedString('calls_busy_call');
        case CometChatUIKitConstants.calls.rejected:
          return getLocalizedString('calls_rejected_call');
        default:
          return getLocalizedString('calls_outgoing_call');
      }
    }
  };

  function getAvatarUrlForCall(call: CometChat.Call) {
    const isSentByMe = (call: any, loggedInUser: CometChat.User) => {
      const senderUid: string = call.initiator?.getUid();
      return !senderUid || senderUid === loggedInUser?.getUid();
    };
    const isSentByMeFlag: boolean = isSentByMe(call, loggedInUser!);
    const callStatus = getCallStatus(call, loggedInUser!);
    if (isSentByMeFlag) {
      switch (callStatus) {
        case getLocalizedString('calls_outgoing_call'):
          return outgoingCallSuccess;
        case getLocalizedString('calls_incoming_call'):
          return outgoingCallSuccess;
        case getLocalizedString('calls_cancelled_call'):
          return outgoingCallSuccess;
        case getLocalizedString('calls_rejected_call'):
          return callRejectedIcon;
        case getLocalizedString('calls_busy_call'):
          return missedCallIcon;
        case getLocalizedString('calls_ended_call'):
          return outgoingCallSuccess;
        case getLocalizedString('calls_answered_call'):
          return outgoingCallSuccess;
        case getLocalizedString('calls_unanswered_call'):
          return missedCallIcon;
        case getLocalizedString('calls_missed_call'):
          return missedCallIcon;
        default:
          return '';
      }
    } else {
      switch (callStatus) {
        case getLocalizedString('calls_outgoing_call'):
          return incomingCallSuccessIcon;
        case getLocalizedString('calls_incoming_call'):
          return incomingCallSuccessIcon;
        case getLocalizedString('calls_cancelled_call'):
          return incomingCallIcon;
        case getLocalizedString('calls_rejected_call'):
          return callRejectedIcon;
        case getLocalizedString('calls_busy_call'):
          return missedCallIcon;
        case getLocalizedString('calls_ended_call'):
          return incomingCallSuccessIcon;
        case getLocalizedString('calls_answered_call'):
          return incomingCallSuccessIcon;
        case getLocalizedString('calls_unanswered_call'):
          return missedCallIcon;
        case getLocalizedString('calls_missed_call'):
          return missedCallIcon;
        default:
          return '';
      }
    }
  }

  return (
    <div className="cometchat-call-log-info">
      {loggedInUser && (
        <CometChatListItem
          title={getCallStatus(call, loggedInUser)}
          avatarURL={getAvatarUrlForCall(call)}
          subtitleView={getListItemSubtitleView(call)}
          trailingView={getListItemTailView(call)}
        />
      )}
    </div>
  );
};
