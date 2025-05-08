/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { JSX, useCallback, useMemo } from 'react';
import '../../styles/CometChatCallLog/CometChatCallLogRecordings.css';
import {
  CalendarObject,
  CometChatDate,
  CometChatList,
  CometChatListItem,
  CometChatLocalize,
  getLocalizedString,
  States,
} from '@cometchat/chat-uikit-react';

export const CometChatCallDetailsRecording = (props: { call: any }) => {
  const { call } = props;

  const handleDownloadClick = useCallback((item: any) => {
    fetch(item?.getRecordingURL())
      .then((response) => {
        return response.blob();
      })
      .then((blob) => {
        const blobURL = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobURL;
        a.download = 'recording.mp4';
        document.body.appendChild(a);
        a.click();
      })
      .catch((error: any) => console.error(error));
  }, []);

  const getRecordings = useCallback(() => {
    try {
      return call?.getRecordings();
    } catch (e) {
      console.log(e);
    }
  }, [call]);

  const getRecordingStartTime = (item: any) => {
    try {
      return item?.getStartTime();
    } catch (e) {
      console.log(e);
    }
  };

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
      <div className="cometchat-call-log-recordings__subtitle">
        <CometChatDate calendarObject={getDateFormat()} timestamp={getRecordingStartTime(item)}></CometChatDate>
      </div>
    );
  }, []);

  const getListItemTailView = useCallback(
    (item: any): JSX.Element => {
      return <div className="cometchat-call-log-recordings__download" onClick={() => handleDownloadClick(item)} />;
    },
    [handleDownloadClick]
  );

  const getListItem = useMemo(() => {
    return function (item: any): any {
      return (
        <>
          <CometChatListItem
            avatarURL=""
            title={item?.getRid()}
            subtitleView={getListItemSubtitleView(item)}
            trailingView={getListItemTailView(item)}
          />
        </>
      );
    };
  }, [getListItemSubtitleView, getListItemTailView]);

  return (
    <div className="cometchat-call-log-recordings">
      {!getRecordings() ? (
        <div className="cometchat-call-log-recordings__empty-state">
          <div className="cometchat-call-log-recordings__empty-state-icon" />
          <div className="cometchat-call-log-recordings__empty-state-text">
            {getLocalizedString('no_recording_available')}
          </div>
        </div>
      ) : (
        <CometChatList
          hideSearch={true}
          list={getRecordings()}
          itemView={getListItem}
          listItemKey="getRid"
          state={States.loaded}
          showSectionHeader={false}
        />
      )}
    </div>
  );
};
