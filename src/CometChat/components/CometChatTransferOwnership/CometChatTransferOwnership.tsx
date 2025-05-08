import React, { JSX, useCallback, useRef, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { useCometChatTransferOwnership } from './useCometChatTransferOwnership';
import '../../styles/CometChatTransferOwnership/CometChatTransferOwnership.css';
import {
  CometChatButton,
  CometChatGroupEvents,
  CometChatGroupMembers,
  CometChatOption,
  CometChatRadioButton,
  CometChatUIKitConstants,
  CometChatUIKitUtility,
  SelectionMode,
  TitleAlignment,
  getLocalizedString,
  useCometChatErrorHandler,
  useRefSync,
} from '@cometchat/chat-uikit-react';
import { useBuilderSettingContext } from '../../context/BuilderSettingsContext';

interface ITransferOwnershipProps {
  /**
   * Group to transfer ownership of
   */
  group: CometChat.Group;
  /**
   * Title of the component
   *
   * @defaultValue `getLocalizedString("TRANSFER_OWNERSHIP")`
   */
  title?: string;
  /**
   * Alignment of the `title` text
   *
   * @defaultValue `TitleAlignment.center`
   */
  titleAlignment?: TitleAlignment;
  /**
   * Image URL for the search icon to use in the search bar
   *
   * @defaultValue `../../assets/search.svg`
   */
  searchIconURL?: string;
  /**
   * Text to be displayed when the search input has no value
   *
   * @defaultValue `getLocalizedString("SEARCH")`
   */
  searchPlaceholderText?: string;
  /**
   * Hide the search bar
   *
   * @defaulValue `false`
   */
  hideSearch?: boolean;
  /**
   * Request builder to fetch group members
   *
   * @remarks
   * If the search input is not empty and the `searchRequestBuilder` prop is not provided,
   * the search keyword of this request builder is set to the text in the search input
   *
   * @defaultValue Default request builder having the limit set to 30
   */
  groupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  /**
   * Request builder with search parameters to fetch group members
   *
   * @remarks
   * If the search input is not empty,
   * the search keyword of this request builder is set to the text in the search input
   */
  searchRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  /**
   * Image URL for the default loading view
   *
   * @defaultValue `../../assets/spinner.svg`
   */
  loadingIconURL?: string;
  /**
   * Custom view for the loading state of the component
   */
  loadingStateView?: JSX.Element;
  /**
   * Text to display in the default empty view
   *
   * @defaultValue `getLocalizedString("NO_USERS_FOUND")`
   */
  emptyStateText?: string;
  /**
   * Custom view for the empty state of the component
   */
  emptyStateView?: JSX.Element;
  /**
   * Text to display in the default error view
   *
   * @defaultValue `getLocalizedString("SOMETHING_WRONG")`
   */
  errorStateText?: string;
  /**
   * Custom view for the error state of the component
   */
  errorStateView?: JSX.Element;
  /**
   * Function to call whenever the component encounters an error
   */
  onError?: ((error: CometChat.CometChatException) => void) | null;
  /**
   * Hide the separator at the bottom of the default list item view
   *
   * @defaultValue `false`
   */
  hideSeparator?: boolean;
  /**
   * Hide user presence
   *
   * @remarks
   * If set to true, the status indicator of the default list item view is not displayed
   *
   * @defaultValue `false`
   */
  disableUsersPresence?: boolean;
  /**
   * Image URL for the close button
   *
   * @defaultValue `../../assets/close2x.svg`
   */
  closeButtonIconURL?: string;
  /**
   * Function to call when the close button is clicked
   */
  onClose?: () => void;
  /**
   * Custom list item view to be rendered for each group member in the fetched list
   */
  listItemView?: (groupMember: CometChat.GroupMember) => JSX.Element;
  /**
   * Custom subtitle view to be rendered for each group member in the fetched list
   *
   * @remarks
   * This prop is used if `listItemView` prop is not provided
   */
  subtitleView?: (groupMember: CometChat.GroupMember) => JSX.Element;
  // Later
  transferButtonText?: string;
  // Later
  onTransferOwnership?: (groupMember: CometChat.GroupMember) => void;
  /**
   * Text to display for the cancel button
   */
  cancelButtonText?: string;
  /**
   * List of actions available on mouse over on the default list item component
   */
  options?: (group: CometChat.Group, groupMember: CometChat.GroupMember) => CometChatOption[];
}

/**
 * Renders transfer ownership view related to a group of a CometChat App
 */
export function CometChatTransferOwnership(props: ITransferOwnershipProps) {
  const {
    group,
    hideSearch = false,
    groupMembersRequestBuilder,
    searchRequestBuilder,
    loadingStateView,
    emptyStateView,
    errorStateView,
    onError,
    onClose,
    listItemView,
    subtitleView,
    transferButtonText = getLocalizedString('transfer'),
    cancelButtonText = getLocalizedString('cancel'),
    options,
  } = props;

  const [loggedInUser, setLoggedInUser] = useState<CometChat.User | null>(null);
  const [isDisabled, setIsDisabled] = useState<boolean>(true);
  const selectedMemberRef = useRef<CometChat.GroupMember | null>(null);
  const errorHandler = useCometChatErrorHandler(onError);
  const groupPropRef = useRefSync(group);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const { chatFeatures } = useBuilderSettingContext();

  /**
   * Changes `selectedMemberRef` reference
   */
  function onSelect(groupMember: CometChat.GroupMember): void {
    if (isDisabled) {
      setIsDisabled(false);
    }
    selectedMemberRef.current = groupMember;
  }

  /**
   * Creates tail view
   */
  function tailView(groupMember: CometChat.GroupMember): JSX.Element {
    const scope =
      group.getOwner() === groupMember.getUid()
        ? CometChatUIKitConstants.groupMemberScope.owner
        : groupMember.getScope();
    if (group.getOwner() === groupMember.getUid()) {
      return <></>;
    } else {
      return (
        <div>
          <CometChatRadioButton
            name={'transfer-ownership'}
            id={groupMember.getUid()}
            labelText={getLocalizedString('member_scope_' + scope)}
            onRadioButtonChanged={() => onSelect(groupMember)}
          />
        </div>
      );
    }
  }

  /**
   * Provides a default behavior to the `onTransferOwnership` prop
   */
  const onTransferOwnershipWrapper = useCallback(async (): Promise<void> => {
    const selectedMember = selectedMemberRef.current;
    if (!selectedMember) {
      return;
    }
    setIsError(false);
    setIsLoading(true);
    try {
      const currentGroup = groupPropRef.current;
      await CometChat.transferGroupOwnership(currentGroup.getGuid(), selectedMember.getUid());
      setIsLoading(false);
      if (loggedInUser) {
        const groupClone = CometChatUIKitUtility.clone(currentGroup);
        groupClone.setOwner(selectedMember.getUid());
        CometChatGroupEvents.ccOwnershipChanged.next({
          group: groupClone,
          newOwner: CometChatUIKitUtility.clone(selectedMember),
        });
        if (onClose) {
          onClose();
        }
      }
      selectedMemberRef.current = null;
    } catch (error) {
      setIsLoading(false);
      setIsError(true);
      errorHandler(error);
    }
  }, [groupPropRef, loggedInUser, onClose, errorHandler]);

  /**
   * Creates confirm button view
   */
  function getConfirmButtonView(): JSX.Element {
    return (
      <div
        className={`cometchat-transfer-ownership__transfer-button ${isDisabled ? 'cometchat-transfer-ownership__transfer-button-disabled' : ''}`}
      >
        <CometChatButton
          text={transferButtonText}
          disabled={isDisabled}
          isLoading={isLoading}
          onClick={onTransferOwnershipWrapper}
        />
      </div>
    );
  }

  /**
   * Creates cancel button view
   */
  function getCancelButtonView(): JSX.Element {
    return (
      <div className="cometchat-transfer-ownership__cancel-button">
        <CometChatButton text={cancelButtonText} onClick={onClose} />
      </div>
    );
  }

  useCometChatTransferOwnership({
    errorHandler,
    setLoggedInUser,
  });

  return (
    <div className="cometchat-transfer-ownership">
      <CometChatGroupMembers
        hideError={undefined}
        onItemClick={undefined}
        options={options}
        group={group}
        hideSearch={hideSearch}
        groupMemberRequestBuilder={groupMembersRequestBuilder}
        searchRequestBuilder={searchRequestBuilder}
        loadingView={loadingStateView}
        emptyView={emptyStateView}
        errorView={errorStateView}
        onError={errorHandler}
        selectionMode={SelectionMode.none}
        itemView={listItemView}
        subtitleView={subtitleView}
        trailingView={tailView}
        hideUserStatus={chatFeatures && !chatFeatures?.coreMessagingExperience?.userAndFriendsPresence}
      />

      <div className="cometchat-transfer-ownership__buttons-wrapper">
        {isError ? <div className="cometchat-transfer-ownership_error-view">{getLocalizedString('error')}</div> : null}
        <div className="cometchat-transfer-ownership__buttons">
          {getCancelButtonView()}
          {getConfirmButtonView()}
        </div>
      </div>
    </div>
  );
}
